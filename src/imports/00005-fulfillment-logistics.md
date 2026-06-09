# Feature: Phân Phối Quà Tặng & Vận Đơn Logistics (Reward Fulfillment & Logistics)
**Mã tài liệu:** `00005-fulfillment-logistics`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này chịu trách nhiệm điều phối việc phân phát phần thưởng cho người chơi khi họ trúng thưởng hoặc đổi quà thành công. Hệ thống phân chia xử lý thành 2 nhóm phần thưởng chính: Quà số (Voucher/E-coupon) gửi qua SMS và Quà vật lý (Bình nước, Áo thun...) cần nhập thông tin giao nhận và chuyển phát.

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Được quản trị bởi **Fulfillment & Logistics Service (NestJS)**:
*   **User Portal (Player):** Nhập địa chỉ giao hàng, xem danh sách phần thưởng trúng tại mục "Hộp quà của tôi".
*   **Business Portal (Merchant):** Xem danh sách người trúng quà vật lý, cập nhật trạng thái vận đơn, xuất Excel gửi hãng vận chuyển ở Giai đoạn 1. Tích hợp API ở Giai đoạn 2.
*   **Backend (NestJS - Fulfillment Service):**
    *   Quản lý tồn kho quà tặng (`vouchers_inventory`).
    *   Áp dụng kỹ thuật Database Locking (Pessimistic Locking `SELECT FOR UPDATE`) để tránh lỗi phát quà âm hoặc tranh chấp tài nguyên khi lượng truy cập lớn.
    *   Xử lý lưu trữ địa chỉ giao hàng (`shipping_details`).
    *   Tích hợp SDK/API của các bên vận chuyển ở Giai đoạn 2 (GHTK/GHN).

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema - PostgreSQL)

```sql
-- 1. Bảng lưu trữ kho mã Voucher của Doanh nghiệp nạp vào (Vouchers Inventory)
CREATE TABLE vouchers_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    prize_name VARCHAR(255) NOT NULL,
    voucher_code VARCHAR(255) NOT NULL, -- Mã voucher thực tế (ví dụ: DISCOUNT50K)
    is_assigned BOOLEAN NOT NULL DEFAULT FALSE, -- Đã được phát cho user nào chưa
    assigned_to_player_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_campaign_voucher UNIQUE (campaign_id, voucher_code)
);
CREATE INDEX idx_vouchers_search ON vouchers_inventory(campaign_id, is_assigned);

-- 2. Bảng lưu trữ Lịch sử trúng thưởng / Đổi quà (Winnings History)
CREATE TABLE winnings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    prize_type VARCHAR(50) NOT NULL, -- VOUCHER, PHYSICAL, POINTS, NONE
    prize_name VARCHAR(255) NOT NULL,
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING (Chờ điền địa chỉ hoặc xử lý), SHIPPING (Đang giao), DELIVERED (Đã giao), FAILED (Hủy/Thất bại)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_winnings_player ON winnings_history(player_id);
CREATE INDEX idx_winnings_merchant ON winnings_history(campaign_id, fulfillment_status);

-- 3. Bảng lưu trữ Địa chỉ giao hàng của Quà vật lý (Shipping Details)
CREATE TABLE shipping_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    winning_id UUID UNIQUE REFERENCES winnings_history(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    tracking_number VARCHAR(100), -- Mã vận đơn của GHTK/GHN ở GĐ2
    shipping_provider VARCHAR(50), -- GHTK, GHN, VIETTEL_POST
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)

*   **Exchange:** `fulfillment.exchange` (Topic)
*   **Subscribing Events (Lắng nghe từ Game Engine khi có người chơi trúng giải):**
    *   `game.prize_won`
        *   **Payload:**
        ```json
        {
          "player_id": "UUID",
          "campaign_id": "UUID",
          "prize_type": "VOUCHER", // VOUCHER, PHYSICAL
          "prize_name": "Voucher giảm giá 50k"
        }
        ```
        *   **Xử lý trong Fulfillment Service:**
            1. Tạo bản ghi trong `winnings_history`.
            2. Nếu là `VOUCHER`: Thực hiện truy vấn khóa bi quan (`SELECT FOR UPDATE SKIP LOCKED`) để lấy ra 1 mã voucher chưa dùng trong `vouchers_inventory` thuộc chiến dịch đó.
            3. Gán mã cho `player_id`. Đổi `fulfillment_status` thành `DELIVERED`.
            4. Publish sự kiện `notification.send_sms` để gửi SMS chứa mã voucher cho người chơi.
            5. Nếu là `PHYSICAL`: Giữ trạng thái `PENDING` và gửi thông báo yêu cầu người chơi điền địa chỉ giao hàng.

---

## 5. API Specifications (REST)

### 5.1. Người chơi điền thông tin địa chỉ giao nhận quà vật lý
*   **Method / Route:** `POST /api/v1/fulfillment/shipping`
*   **Headers:** `Authorization: Bearer <token>` (Player Token)
*   **Request Payload:**
```json
{
  "winning_id": "winning-uuid-123",
  "recipient_name": "Nguyễn Văn A",
  "recipient_phone": "0909123456",
  "province": "Thành phố Hồ Chí Minh",
  "district": "Quận 1",
  "ward": "Phường Bến Nghé",
  "street_address": "123 Lê Lợi"
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật địa chỉ nhận quà thành công. Merchant sẽ tiến hành vận chuyển."
}
```

### 5.2. Merchant cập nhật trạng thái vận đơn bằng tay (Giai đoạn 1)
*   **Method / Route:** `PATCH /api/v1/fulfillment/winnings/:id/status`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Request Payload:**
```json
{
  "status": "SHIPPING", // SHIPPING, DELIVERED, FAILED
  "tracking_number": "TRK99988877", // Nếu có
  "shipping_provider": "GHTK"
}
```
*   **Response (200 OK):**
```json
{
  "success": true,
  "winning_id": "winning-uuid-123",
  "status": "SHIPPING"
}
```

### 5.3. Export danh sách vận đơn ra file Excel (Giai đoạn 1)
*   **Method / Route:** `GET /api/v1/fulfillment/winnings/export`
*   **Headers:** `Authorization: Bearer <token>` (Merchant Token)
*   **Query Params:** `campaign_id=uuid&status=PENDING`
*   **Response (200 OK):** Trả về file Stream Excel (.xlsx) chứa các thông tin: Họ tên, Số điện thoại nhận, Địa chỉ chi tiết, Tên quà tặng.

---

## 6. Logic Xử lý Concurrency & Database Locking (Anti-Overcommit)
Để tránh tình trạng cùng một lúc có nhiều người chơi trúng giải Voucher nhưng hệ thống phát trùng mã hoặc phát vượt quá số lượng Voucher hiện có trong kho:

```typescript
// NestJS Service Pseudo-code
async assignVoucherReward(campaignId: string, playerId: string, prizeName: string): Promise<string> {
  return await this.dataSource.transaction(async (entityManager) => {
    // 1. Khóa bi quan và lấy ra 1 dòng duy nhất chưa dùng
    const voucher = await entityManager.createQueryBuilder(VoucherInventory, 'voucher')
      .setLock('pessimistic_write')
      .where('voucher.campaign_id = :campaignId', { campaignId })
      .andWhere('voucher.is_assigned = false')
      .andWhere('voucher.prize_name = :prizeName', { prizeName })
      .orderBy('voucher.created_at', 'ASC')
      .limit(1)
      .getOne();

    if (!voucher) {
      throw new BadRequestException('Hết voucher trong kho phần thưởng!');
    }

    // 2. Cập nhật mã voucher đó sang cho User nhận
    voucher.is_assigned = true;
    voucher.assigned_to_player_id = playerId;
    voucher.assigned_at = new Date();
    await entityManager.save(voucher);

    return voucher.voucher_code;
  });
}
```
*   *Lưu ý:* Việc dùng `pessimistic_write` kết hợp với database index trên (`campaign_id`, `is_assigned`) đảm bảo tốc độ phản hồi cực kỳ nhanh (đạt chuẩn dưới 500ms theo NFR).
