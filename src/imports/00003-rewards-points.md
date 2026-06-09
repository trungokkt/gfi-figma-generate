# Feature: Nhập Mã Dự Thưởng & Quản lý Điểm (Rewards Code Entry & Points Management)
**Mã tài liệu:** `00003-rewards-points`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, Redis, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này chịu trách nhiệm sinh mã, nhập mã dự thưởng để tích lũy điểm số, chống brute-force dò mã (Rate Limiting), và quản lý quỹ điểm riêng biệt theo từng chiến dịch (điểm hết hạn khi chiến dịch kết thúc).

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Feature này được vận hành bởi **Rewards & Points Service (NestJS)**:
*   **Business Portal (Merchant):** Tải file CSV chứa danh sách mã và điểm tương ứng, hoặc sinh mã tự động với số điểm cấu hình chung.
*   **User Portal (Player):** Nhập mã dự thưởng, xem số dư điểm hiện có theo từng chiến dịch, xem lịch sử giao dịch điểm.
*   **Backend (NestJS - Rewards & Points Service):**
    *   Xử lý logic xác thực định dạng mã (8 ký tự in hoa + số).
    *   Quản lý số dư điểm của người chơi trên từng chiến dịch.
    *   Tích hợp Redis để xử lý khóa tài khoản (Block) chống dò mã dự thưởng.

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema - PostgreSQL)

```sql
-- 1. Bảng lưu trữ Mã dự thưởng được phát hành (Rewards Codes)
CREATE TABLE rewards_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL, -- Tham chiếu sang Campaign Service
    code VARCHAR(8) UNIQUE NOT NULL, -- Định dạng 8 ký tự in hoa + số (ví dụ: GFI88899)
    points INT NOT NULL DEFAULT 0, -- Số điểm quy đổi tương ứng với mã này
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by_player_id UUID, -- Tham chiếu sang Player Auth Service
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_rewards_codes_lookup ON rewards_codes(code, is_used);
CREATE INDEX idx_rewards_codes_campaign ON rewards_codes(campaign_id);

-- 2. Bảng quản lý số dư Điểm của Người chơi theo từng Chiến dịch (Player Points)
CREATE TABLE player_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- Tham chiếu sang Player Auth Service
    campaign_id UUID NOT NULL, -- Tham chiếu sang Campaign Service
    points_balance INT NOT NULL DEFAULT 0, -- Điểm khả dụng hiện tại
    accumulated_points INT NOT NULL DEFAULT 0, -- Tổng điểm đã kiếm được
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_player_campaign UNIQUE (player_id, campaign_id)
);
CREATE INDEX idx_player_points_search ON player_points(player_id, campaign_id);

-- 3. Bảng Nhật ký giao dịch điểm (Point Transactions)
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- EARNED (Nhập mã), SPENT (Quay game/Đổi quà), EXPIRED (Chiến dịch kết thúc)
    amount INT NOT NULL, -- Số lượng điểm thay đổi
    description VARCHAR(255),
    reference_id UUID, -- ID của mã dự thưởng hoặc ID phần thưởng trúng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_point_transactions_player ON point_transactions(player_id, campaign_id);
```

---

## 4. Thiết kế Cache & Chống gian lận (Redis Schema)
Để ngăn chặn dò mã dự thưởng (Brute-force attack), hệ thống áp dụng cơ chế khóa tài khoản tạm thời bằng Redis:

*   **Bộ đếm số lần nhập sai:**
    *   **Key:** `player:failed_codes_count:{player_id}`
    *   **Value:** `integer` (tối đa bằng 5)
    *   **TTL:** 15 phút (reset sau 15 phút từ lần nhập sai đầu tiên hoặc khi nhập đúng mã).
*   **Trạng thái khóa tài khoản nhập mã:**
    *   **Key:** `player:code_entry_blocked:{player_id}`
    *   **Value:** `true`
    *   **TTL:** 2 giờ (hệ thống từ chối xử lý mọi yêu cầu nhập mã từ tài khoản này khi key tồn tại).

---

## 5. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)

*   **Exchange:** `points.exchange` (Topic)
*   **Publishing Events (Khi điểm số biến động):**
    *   `points.earned` (Khi người chơi nhập mã thành công và cộng điểm)
        *   **Payload:** `{ "player_id": "UUID", "campaign_id": "UUID", "points_earned": 50, "total_balance": 150 }`
    *   `points.spent` (Khi người chơi tiêu thụ điểm để quay game hoặc đổi quà)
        *   **Payload:** `{ "player_id": "UUID", "campaign_id": "UUID", "points_spent": 20, "total_balance": 130 }`
*   **Subscribing Events:**
    *   `campaign.status_changed` (Từ Campaign Service - Nhận biết chiến dịch đã kết thúc để reset điểm)
        *   **Payload:** `{ "campaign_id": "UUID", "new_status": "ENDED" }`
        *   **Action:** Trích xuất toàn bộ bản ghi `player_points` thuộc `campaign_id` này, cập nhật số dư `points_balance` về 0, đồng thời ghi nhận các dòng giao dịch `transaction_type` = `EXPIRED`.

---

## 6. API Specifications (REST)

### 6.1. Nhập mã dự thưởng tích điểm
*   **Method / Route:** `POST /api/v1/points/redeem-code`
*   **Headers:** `Authorization: Bearer <token>` (Player Token)
*   **Request Payload:**
```json
{
  "code": "GFI2026X",
  "campaign_id": "campaign-uuid-abc"
}
```
*   **Response (200 OK - Thành công):**
```json
{
  "success": true,
  "points_earned": 50,
  "new_balance": 120,
  "message": "Nạp mã thành công! Bạn được cộng 50 điểm."
}
```
*   **Response (400 Bad Request - Sai định dạng):**
```json
{
  "success": false,
  "error_code": "INVALID_FORMAT",
  "message": "Mã dự thưởng phải gồm đúng 8 ký tự in hoa và chữ số."
}
```
*   **Response (423 Locked - Bị khóa do dò mã):**
```json
{
  "success": false,
  "error_code": "BRUTE_FORCE_BLOCKED",
  "message": "Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau 2 giờ.",
  "unlock_in_seconds": 7200
}
```
*   **Response (404 Not Found - Mã không tồn tại / Đã dùng):**
    *   Tăng bộ đếm sai lên 1 đơn vị trong Redis. Nếu đạt mức 5, kích hoạt khóa 2 giờ.

### 6.2. Import file CSV mã dự thưởng (Phía Merchant)
*   **Method / Route:** `POST /api/v1/points/import-codes`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Request Form-Data:**
    *   `file`: File CSV (Cột 1: `code` (8 ký tự), Cột 2: `points` (optional))
    *   `campaign_id`: `campaign-uuid-abc`
    *   `flat_points`: `10` (Chỉ dùng nếu file CSV chỉ có 1 cột mã để gán điểm đồng nhất)
*   **Response (200 OK):**
```json
{
  "success": true,
  "imported_count": 10000,
  "message": "Import thành công 10,000 mã dự thưởng."
}
```
