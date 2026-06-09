# Feature: Quản lý Chiến dịch & Thư viện Giao diện (Campaign & Template Management)
**Mã tài liệu:** `00002-campaign-template`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, MongoDB, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này cung cấp khả năng tạo lập chiến dịch Marketing, cấu hình trò chơi bổ trợ, chỉnh sửa giao diện hiển thị cho người chơi (Visual Builder) thông qua hệ thống kéo thả/cấu hình giao diện và áp dụng thư viện Template mẫu do Admin cung cấp.

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Bao gồm hai dịch vụ:
1.  **Campaign Service (NestJS):**
    *   Quản lý thông tin chiến dịch, vòng đời chiến dịch (`DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`).
    *   Hỗ trợ chỉnh sửa thông số ngay cả khi chiến dịch đang chạy (áp dụng lập tức).
    *   Lưu trữ metadata chiến dịch trên PostgreSQL và lưu dữ liệu cấu hình thiết kế giao diện trên MongoDB.
2.  **Template Library Service (NestJS):**
    *   Quản lý danh mục Template mẫu (Basic/Premium) do Admin hệ thống tạo.
    *   Lưu trữ cấu hình UI mặc định và Game mặc định của Template trong MongoDB.

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema)

### 3.1. Dữ liệu Metadata & Vòng đời Chiến dịch (PostgreSQL - Campaign Service)
```sql
-- Bảng Chiến dịch (Campaigns)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL, -- Tham chiếu sang Merchant Service
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, ENDED
    template_id UUID, -- ID của template mẫu được áp dụng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX idx_campaigns_status_dates ON campaigns(status, start_date, end_date);
```

### 3.2. Cấu hình giao diện Visual Builder & Trò chơi bổ trợ (MongoDB - Campaign Service)
Cấu hình giao diện của từng chiến dịch được lưu trữ dưới dạng document động trong MongoDB (Collection: `campaign_visuals`):

```json
{
  "_id": "ObjectId",
  "campaign_id": "string (UUID)",
  "branding": {
    "logo_url": "https://cdn.gfi.vn/merchant/logo.png",
    "banner_url": "https://cdn.gfi.vn/merchant/banner.png",
    "primary_color": "#FF5733",
    "background_image_url": "https://cdn.gfi.vn/merchant/bg.jpg"
  },
  "content": {
    "title": "Vòng quay may mắn hè 2026",
    "description": "Nhập mã trúng thưởng, rinh quà liền tay!",
    "rules": "Mỗi mã tương ứng 10 điểm. Quay thưởng tốn 20 điểm..."
  },
  "games": [
    {
      "game_type": "LUCKY_WHEEL",
      "is_active": true,
      "config": {
        "cost_per_spin": 20,
        "slices": [
          { "slice_index": 1, "prize_type": "VOUCHER", "prize_name": "Voucher 20k", "probability": 0.1 },
          { "slice_index": 2, "prize_type": "PHYSICAL", "prize_name": "Bình giữ nhiệt", "probability": 0.05 },
          { "slice_index": 3, "prize_type": "POINTS", "prize_name": "Thêm 50 điểm", "probability": 0.25 },
          { "slice_index": 4, "prize_type": "NONE", "prize_name": "Chúc may mắn", "probability": 0.6 }
        ]
      }
    }
  ],
  "updated_at": "ISODate"
}
```

### 3.3. Thư viện Templates (MongoDB - Template Library Service)
Danh mục các thiết kế mẫu do Admin cấu hình (Collection: `templates`):

```json
{
  "_id": "ObjectId",
  "template_uuid": "string (UUID)",
  "name": "Template Tết Bính Ngọ 2026",
  "is_premium": true, // Gói cước Free không dùng được
  "default_branding": {
    "primary_color": "#D32F2F",
    "background_image_url": "https://cdn.gfi.vn/templates/tet-bg.jpg"
  },
  "default_games": [
    {
      "game_type": "LUCKY_WHEEL",
      "config": {
        "cost_per_spin": 10,
        "slices": [...]
      }
    }
  ],
  "created_by": "admin-uuid",
  "created_at": "ISODate"
}
```

---

## 4. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)

*   **Exchange:** `campaign.exchange` (Topic)
*   **Publishing Events:**
    *   `campaign.status_changed` (Gửi đi khi trạng thái chiến dịch thay đổi)
        *   **Payload:** `{ "campaign_id": "UUID", "merchant_id": "UUID", "old_status": "DRAFT", "new_status": "ACTIVE" }`
*   **Subscribing Events:**
    *   `tenant.subscription.expired` (Từ Tenant Service - Tự động tắt chiến dịch của Merchant khi hết thời gian ân hạn)
        *   **Payload:** `{ "merchant_id": "UUID" }`
        *   **Action:** Cập nhật toàn bộ chiến dịch đang `ACTIVE` của Merchant về `PAUSED` hoặc `ENDED`.

---

## 5. API Specifications (REST)

### 5.1. Tạo mới chiến dịch từ Template
*   **Method / Route:** `POST /api/v1/campaigns`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Request Payload:**
```json
{
  "name": "Chiến dịch Mùa Hè 2026",
  "start_date": "2026-06-10T00:00:00Z",
  "end_date": "2026-07-10T00:00:00Z",
  "template_id": "template-uuid-here" // Nếu để trống sẽ tạo chiến dịch trắng
}
```
*   **Response (201 Created):**
```json
{
  "id": "campaign-uuid-123",
  "name": "Chiến dịch Mùa Hè 2026",
  "status": "DRAFT",
  "template_id": "template-uuid-here"
}
```

### 5.2. Cập nhật thiết kế Visual Builder (Chỉnh sửa lúc chiến dịch đang hoạt động)
*   **Method / Route:** `PUT /api/v1/campaigns/:id/visuals`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Request Payload:** Dữ liệu JSON chứa `branding`, `content`, `games` cần sửa đổi.
*   **Response (200 OK):**
```json
{
  "success": true,
  "campaign_id": "campaign-uuid-123",
  "updated_at": "2026-06-09T11:25:00Z"
}
```

---

## 6. Thiết kế Frontend Customization (NextJS Visual Builder)
*   NextJS sử dụng cơ chế kéo thả trực quan (Interactive Layout Builder).
*   Merchant khi chỉnh sửa cấu hình màu sắc, hình nền sẽ có một màn hình Live Preview giả lập hiển thị trên Mobile-first Mockup.
*   Sử dụng cơ chế lưu bản nháp tự động (Auto-save) gửi API lên NestJS để cập nhật nhanh cấu hình Visual Builder.
