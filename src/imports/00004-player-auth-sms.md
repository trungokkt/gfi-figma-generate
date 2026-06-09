# Feature: Xác thực Người chơi & Tích hợp SMS Gateway (Player Authentication & SMS Gateway)
**Mã tài liệu:** `00004-player-auth-sms`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, Redis, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này xử lý đăng ký, đăng nhập và định danh người chơi (Players/End Users) trên thiết bị di động (Mobile-first). Hệ thống yêu cầu xác thực OTP qua SMS khi đăng ký, quản lý mật khẩu an toàn, và điều phối gửi SMS (OTP, Voucher) thông qua hạ tầng dùng chung hoặc cấu hình SMS riêng của từng doanh nghiệp (Bring Your Own SMS Gateway).

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Bao gồm hai dịch vụ phối hợp:
1.  **Player Auth Service (NestJS):**
    *   Quản lý thông tin tài khoản người chơi (`players`).
    *   Xử lý logic đăng nhập JWT, đăng ký, quên mật khẩu.
    *   Lưu trữ tài khoản trên PostgreSQL.
2.  **Notification / SMS Service (NestJS):**
    *   Quản lý cấu hình cổng kết nối SMS (`merchant_sms_gateways`).
    *   Nhận yêu cầu gửi tin nhắn qua RabbitMQ và điều phối đến các SMS Gateway (eSMS, VietGuys, Twilio).
    *   Thực hiện cơ chế dự phòng định tuyến (Failover Routing) giữa các nhà cung cấp SMS dùng chung.
    *   Quản lý cấu hình SMS riêng (Brandname/API Key) của Merchant gói Pro/Enterprise.

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema - PostgreSQL)

### 3.1. Dữ liệu Tài khoản Người chơi (PostgreSQL - Player Auth Service)
```sql
-- Bảng tài khoản Người chơi (Players)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL, -- Số điện thoại định danh người chơi
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_players_phone ON players(phone_number);
```

### 3.2. Cấu hình Cổng kết nối SMS của Doanh nghiệp (PostgreSQL - Notification Service)
```sql
-- Bảng cấu hình cổng kết nối SMS riêng của Merchant (Merchant SMS Gateways)
CREATE TABLE merchant_sms_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID UNIQUE NOT NULL, -- Tham chiếu sang Merchant Service
    provider_type VARCHAR(50) NOT NULL, -- ESMS, VIETGUYS, TWILIO
    api_key VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255),
    brandname VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Thiết kế Cache & Chống Spam SMS (Redis Schema)

*   **Lưu trữ mã OTP tạm thời:**
    *   **Key:** `sms:otp:{phone_number}:{purpose}` (Ví dụ: `sms:otp:0901234567:SIGNUP`)
    *   **Value:** `123456` (Mã OTP 6 chữ số)
    *   **TTL:** 5 phút.
*   **Chống Spam OTP (Rate Limiting):**
    *   **Key:** `sms:rate_limit:{phone_number}`
    *   **Value:** `integer` (Đếm số lượng SMS OTP đã gửi trong 5 phút, tối đa bằng 3)
    *   **TTL:** 5 phút.
    *   **Quy tắc:** Nếu giá trị key vượt quá 3, hệ thống lập tức từ chối gửi thêm OTP đến số điện thoại này và báo lỗi.

---

## 5. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)

*   **Exchange:** `notification.exchange` (Topic)
*   **Queues:** `sms.send.queue`
*   **Publishing Events (Từ Auth Service / Game Service yêu cầu gửi SMS):**
    *   `notification.send_sms`
        *   **Payload:**
        ```json
        {
          "merchant_id": "UUID",
          "phone_number": "+84901234567",
          "message": "Ma OTP dang ky app GFI cua ban la 123456. Hieu luc trong 5 phut.",
          "purpose": "OTP" // OTP, VOUCHER
        }
        ```
*   **Subscribing Events (Notification Service lắng nghe):**
    *   Dịch vụ SMS lắng nghe queue `sms.send.queue`:
        *   *Bước 1:* Kiểm tra `merchant_id` xem có cấu hình Gateway riêng trong bảng `merchant_sms_gateways` và đang kích hoạt không.
        *   *Bước 2:* Nếu có cổng riêng (gói Pro/Enterprise) -> Gửi tin nhắn qua cổng đó.
        *   *Bước 3:* Nếu không -> Gửi qua cổng dùng chung của hệ thống (Failover routing).
        *   *Bước 4:* Sau khi gửi thành công -> Publish sự kiện `sms.sent` sang `tenant.exchange` để trừ tiền/hạn mức SMS của Merchant.

---

## 6. API Specifications (REST)

### 6.1. Đăng ký tài khoản (Gửi OTP kích hoạt)
*   **Method / Route:** `POST /api/v1/auth/signup`
*   **Request Payload:**
```json
{
  "phone_number": "0901234567"
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến số điện thoại của bạn.",
  "expires_in_seconds": 300
}
```
*   **Response (429 Too Many Requests - Khi bị giới hạn spam):**
```json
{
  "success": false,
  "error_code": "OTP_RATE_LIMIT_EXCEEDED",
  "message": "Bạn đã gửi quá số lần cho phép. Vui lòng thử lại sau 5 phút."
}
```

### 6.2. Xác thực OTP & Đặt mật khẩu (Hoàn tất đăng ký)
*   **Method / Route:** `POST /api/v1/auth/signup/verify`
*   **Request Payload:**
```json
{
  "phone_number": "0901234567",
  "otp": "123456",
  "password": "StrongPassword123!"
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tài khoản của bạn đã được kích hoạt thành công.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 6.3. Đăng nhập bằng SĐT & Mật khẩu
*   **Method / Route:** `POST /api/v1/auth/login`
*   **Request Payload:**
```json
{
  "phone_number": "0901234567",
  "password": "StrongPassword123!"
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": {
    "id": "player-uuid-123",
    "phone_number": "0901234567"
  }
}
```
