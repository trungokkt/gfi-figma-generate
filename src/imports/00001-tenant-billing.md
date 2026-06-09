# Feature: Quản lý Doanh nghiệp & Gói Dịch Vụ (Tenant & Subscription Management)
**Mã tài liệu:** `00001-tenant-billing`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, Redis, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này chịu trách nhiệm quản lý đăng ký của các doanh nghiệp (Merchants/Tenants), cấu hình gói cước SaaS (Free, Growth, Pro, Enterprise), theo dõi và kiểm soát hạn mức thành viên (Unique Players Limit) và hạn mức SMS, xử lý cơ chế gia hạn thanh toán kèm thời gian ân hạn (7-day Grace Period), nạp tiền mua thêm lượt SMS và tích hợp các cổng thanh toán.

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Hệ thống sử dụng **Tenant & Billing Service** độc lập:
*   **Frontend (NextJS - Business/Merchant Portal & Admin Portal):**
    *   Trang Admin: Tạo và chỉnh sửa gói dịch vụ, giám sát tài nguyên của các doanh nghiệp.
    *   Trang Merchant: Xem thông tin gói hiện tại, thanh toán gia hạn, nạp SMS lẻ, xem lịch sử giao dịch.
*   **Backend (NestJS - Tenant & Billing Service):**
    *   Cung cấp các API quản lý Tenant, Subscription, Billing.
    *   Tích hợp Payment Gateway (VNPAY, Momo, Stripe).
    *   Quản lý số dư SMS và số lượng Unique Players (phối hợp với các service khác qua RabbitMQ).

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema - PostgreSQL)

```sql
-- 1. Bảng Doanh nghiệp (Merchants)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_code VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, GRACE_PERIOD, SUSPENDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_merchants_status ON merchants(status);

-- 2. Bảng cấu hình gói dịch vụ SaaS (Subscription Plans)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Free, Growth, Pro, Enterprise
    player_limit INT NOT NULL DEFAULT 50, -- -1 đại diện cho không giới hạn (Enterprise)
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    included_sms INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng đăng ký dịch vụ của doanh nghiệp (Merchant Subscriptions)
CREATE TABLE merchant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, IN_GRACE_PERIOD, EXPIRED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sub_merchant_status ON merchant_subscriptions(merchant_id, status);

-- 4. Bảng số dư SMS (SMS Balances)
CREATE TABLE sms_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    free_sms_balance INT NOT NULL DEFAULT 0, -- SMS đi kèm gói (reset hàng tháng)
    purchased_sms_balance INT NOT NULL DEFAULT 0, -- SMS mua thêm (không hết hạn)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_sms_balances_merchant ON sms_balances(merchant_id);

-- 5. Bảng giao dịch thanh toán (Payment Transactions)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- SUBSCRIPTION_RENEW, SUBSCRIPTION_UPGRADE, SMS_ADDON
    gateway VARCHAR(50) NOT NULL, -- VNPAY, MOMO, STRIPE
    gateway_txn_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Thiết kế Cache (Redis Schema)
Redis được sử dụng để cache trạng thái đăng ký và số dư của doanh nghiệp nhằm giảm tải truy vấn cho PostgreSQL:

*   **Cache thông tin Subscription:**
    *   **Key:** `tenant:subscription:{merchant_id}`
    *   **Value:** JSON `{ "plan_id": "...", "status": "ACTIVE", "player_limit": 10000, "ends_at": "..." }`
    *   **TTL:** 24 giờ (hoặc sẽ bị xóa/cập nhật trực tiếp khi có sự kiện thanh toán/gia hạn).
*   **Cache số dư SMS:**
    *   **Key:** `tenant:sms_balance:{merchant_id}`
    *   **Value:** JSON `{ "free_sms": 45, "purchased_sms": 200 }`
    *   **TTL:** 1 giờ (cập nhật đồng bộ khi trừ SMS).

---

## 5. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)
Dịch vụ Tenant & Billing gửi/nhận các thông tin qua RabbitMQ Exchange dạng `Topic`:

*   **Exchange:** `tenant.exchange` (Topic)
*   **Publishing Events (Khi có thay đổi về đăng ký hoặc số dư):**
    *   `tenant.subscription.activated` / `tenant.subscription.updated`
        *   **Payload:** `{ "merchant_id": "UUID", "plan_name": "Pro", "player_limit": 50000 }`
    *   `tenant.subscription.expired` (Khi hết hạn 7 ngày ân hạn)
        *   **Payload:** `{ "merchant_id": "UUID" }`
    *   `tenant.sms.balance_updated`
        *   **Payload:** `{ "merchant_id": "UUID", "total_balance": 245 }`
*   **Subscribing Events (Lắng nghe từ các dịch vụ khác):**
    *   `player.registered` (Từ Campaign/User Service - để cập nhật lượng Unique Players)
        *   **Payload:** `{ "merchant_id": "UUID", "campaign_id": "UUID", "player_phone": "..." }`
    *   `sms.sent` (Từ Notification Service - để trừ số dư SMS của Merchant)
        *   **Payload:** `{ "merchant_id": "UUID", "sms_count": 1 }`

---

## 6. API Specifications (REST)

### 6.1. Khởi tạo thanh toán mua gói / SMS
*   **Method / Route:** `POST /api/v1/billing/checkout`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Request Payload:**
```json
{
  "payment_type": "SMS_ADDON", // SUBSCRIPTION_RENEW, SMS_ADDON
  "plan_id": "optional-plan-uuid",
  "sms_quantity": 500, // chỉ dùng khi payment_type là SMS_ADDON
  "gateway": "VNPAY" // VNPAY, MOMO, STRIPE
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "transaction_id": "txn_123456",
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

### 6.2. Webhook nhận kết quả từ cổng thanh toán (IPN/Callback)
*   **Method / Route:** `GET /api/v1/billing/checkout/callback`
*   **Request Params:** Dữ liệu callback từ cổng thanh toán (checksum, transaction_id, status...)
*   **Response (200 OK):** Trả về định dạng mà gateway yêu cầu (ví dụ với VNPAY: `{"RspCode": "00", "Message": "Confirm success"}`). Dịch vụ sẽ tự động gửi sự kiện qua RabbitMQ để cập nhật dữ liệu.

---

## 7. Quy trình xử lý nghiệp vụ (System Flows)

### 7.1. Xử lý gia hạn và thời gian ân hạn (Grace Period Job)
Hằng ngày, một Cron job trong **Tenant & Billing Service** quét các đăng ký hết hạn:
1. Nếu `subscription.end_date` < `now()` và `status` = 'ACTIVE':
   - Chuyển `status` thành 'IN_GRACE_PERIOD'.
   - Tính toán `grace_period_ends_at` = `end_date + 7 ngày`.
   - Publish sự kiện `tenant.subscription.grace_period` để Notification Service gửi SMS/Email nhắc nhở Merchant.
2. Nếu `grace_period_ends_at` < `now()` và chưa được thanh toán:
   - Chuyển `status` thành 'EXPIRED'.
   - Cập nhật trạng thái `merchants.status` = 'SUSPENDED'.
   - Publish sự kiện `tenant.subscription.expired` lên RabbitMQ.
   - **Campaign Service** lắng nghe sự kiện này và tự động khóa toàn bộ User Portal của Merchant đó.
