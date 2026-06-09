# Feature: Động cơ Trò chơi & Cơ chế Trúng thưởng (Game Engine & Plugin Architecture)
**Mã tài liệu:** `00006-game-engine`
**Kiến trúc:** Microservices (NestJS backend, NextJS frontend, PostgreSQL, Redis, RabbitMQ)

---

## 1. Tổng quan hệ thống (Overview)
Feature này chịu trách nhiệm vận hành các trò chơi bổ trợ (Ví dụ: Vòng quay may mắn, Đổi quà tích lũy), quản lý luật chơi (chi phí điểm mỗi lượt chơi, cấu hình các phần quà trên ô quay), xử lý thuật toán quay số trúng thưởng (kết hợp tỉ lệ % và giới hạn số lượng quà trúng tối đa mỗi ngày/tuần/toàn chiến dịch) để chống cạn kiệt quà lớn quá nhanh.

---

## 2. Kiến trúc dịch vụ (Service Boundaries)
Được vận hành độc lập bởi **Game Engine Service (NestJS)**:
*   **User Portal (Player):** Giao diện Vòng quay (Lucky Wheel) hiển thị các phần quà động, thực hiện bấm nút Quay thưởng, tiêu thụ điểm tích lũy và hiển thị kết quả trúng quà.
*   **Business Portal (Merchant):** Cấu hình cơ cấu quà, tỉ lệ trúng thưởng của từng ô quà, giá trị điểm cho mỗi lượt quay, và giới hạn số lượng quà lớn phát ra tối đa.
*   **Backend (NestJS - Game Engine Service):**
    *   Xử lý logic tính toán trúng thưởng một cách bảo mật trên Server-side.
    *   Sử dụng Redis để đếm và kiểm soát giới hạn quà phát ra tức thời theo ngày/tuần (Atomic counter).
    *   Trừ điểm người chơi đồng thời với việc trừ tồn kho quà tặng qua DB transaction.

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema - PostgreSQL)

```sql
-- 1. Bảng lưu trữ cấu hình Trò chơi bổ trợ (Game Instances)
CREATE TABLE game_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL, -- Tham chiếu sang Campaign Service
    game_type VARCHAR(50) NOT NULL, -- LUCKY_WHEEL, REDEMPTION, SLOT_MACHINE...
    cost_points INT NOT NULL DEFAULT 0, -- Số điểm tốn cho 1 lượt chơi (Ví dụ: 20 điểm/quay)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_game_instances_campaign ON game_instances(campaign_id, game_type);

-- 2. Bảng cơ cấu phần thưởng cấu hình cho từng game (Game Prize Rules)
CREATE TABLE game_prize_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_instance_id UUID REFERENCES game_instances(id) ON DELETE CASCADE,
    prize_name VARCHAR(255) NOT NULL,
    prize_type VARCHAR(50) NOT NULL, -- VOUCHER, PHYSICAL, POINTS, NONE
    probability NUMERIC(5, 4) NOT NULL, -- Tỉ lệ trúng cố định (Ví dụ: 0.1000 = 10%)
    max_limit_per_day INT DEFAULT -1, -- Giới hạn số lượng trúng tối đa mỗi ngày (-1: không giới hạn)
    max_limit_per_week INT DEFAULT -1, -- Giới hạn tối đa mỗi tuần
    max_limit_total INT DEFAULT -1, -- Giới hạn tối đa cho toàn bộ chiến dịch
    current_distributed_total INT NOT NULL DEFAULT 0, -- Tổng số đã phát ra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_prize_rules_game ON game_prize_rules(game_instance_id);

-- 3. Bảng ghi nhận lượt chơi của Người chơi (Game Plays)
CREATE TABLE game_plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- Tham chiếu sang Player Auth Service
    game_instance_id UUID REFERENCES game_instances(id),
    cost_points INT NOT NULL, -- Điểm đã tiêu hao
    prize_rule_id UUID REFERENCES game_prize_rules(id), -- Giải thưởng trúng được
    is_success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_game_plays_player ON game_plays(player_id);
```

---

## 4. Thiết kế Giới hạn Quà trúng tối đa (Redis Schema)
Để thực thi nghiêm ngặt giới hạn số lượng quà lớn tối đa (ví dụ: tối đa 2 chiếc iPhone/ngày), hệ thống sử dụng các bộ đếm nguyên tử (Atomic Counter) trong Redis để kiểm tra trước khi thực hiện thuật toán quay thưởng:

*   **Bộ đếm giới hạn quà theo ngày:**
    *   **Key:** `game:limit:day:{prize_rule_id}:{date_YYYY_MM_DD}` (Ví dụ: `game:limit:day:uuid-1234:2026_06_09`)
    *   **Value:** `integer` (Đếm số lượng quà này đã được phát ra trong ngày hôm nay)
    *   **TTL:** 48 giờ.
*   **Bộ đếm giới hạn quà theo tuần:**
    *   **Key:** `game:limit:week:{prize_rule_id}:{week_number}`
    *   **Value:** `integer`
    *   **TTL:** 14 ngày.

*   **Logic thực thi trên server khi người chơi bấm nút Quay thưởng:**
    1. Lấy danh sách cơ cấu giải thưởng (`game_prize_rules`) của game.
    2. Sử dụng Redis `MGET` để lấy toàn bộ bộ đếm giới hạn hiện tại của các giải thưởng đó.
    3. Loại bỏ (Filter out) các giải thưởng đã chạm giới hạn tối đa theo ngày/tuần/tổng số khỏi danh sách quay thưởng.
    4. Phân phối lại tỉ lệ % trúng thưởng (normalize probability) của các ô còn lại để tiến hành quay số ngẫu nhiên trên backend.
    5. Nếu trúng giải có giới hạn -> Thực hiện lệnh Redis `INCR` để cộng dồn bộ đếm. Nếu quá trình update DB thất bại (Rollback transaction), thực hiện `DECR` để hoàn lại số lượng bộ đếm.

---

## 5. Thiết kế Giao tiếp sự kiện (RabbitMQ Events)

*   **Exchange:** `game.exchange` (Topic)
*   **Publishing Events (Khi người chơi thực hiện quay game trúng giải):**
    *   `game.prize_won` (Gửi sang Fulfillment Service để phát mã voucher hoặc tạo đơn vận chuyển)
        *   **Payload:** `{ "player_id": "UUID", "campaign_id": "UUID", "prize_type": "PHYSICAL", "prize_name": "Bình giữ nhiệt", "prize_rule_id": "UUID" }`
    *   `points.spent` (Gửi sang Points Service để tiến hành trừ điểm số dư tài khoản của người chơi)
        *   **Payload:** `{ "player_id": "UUID", "campaign_id": "UUID", "points_spent": 20 }`

---

## 6. API Specifications (REST)

### 6.1. Thực hiện lượt chơi game (Quay số/Đổi quà)
*   **Method / Route:** `POST /api/v1/game/:instance_id/play`
*   **Headers:** `Authorization: Bearer <token>` (Player Token)
*   **Response (200 OK - Trúng giải):**
```json
{
  "success": true,
  "play_id": "game-play-uuid-999",
  "points_deducted": 20,
  "prize": {
    "prize_rule_id": "prize-uuid-333",
    "prize_name": "Bình giữ nhiệt",
    "prize_type": "PHYSICAL"
  }
}
```
*   **Response (400 Bad Request - Không đủ điểm):**
```json
{
  "success": false,
  "error_code": "INSUFFICIENT_POINTS",
  "message": "Số dư điểm của bạn không đủ để thực hiện lượt chơi (Yêu cầu: 20 điểm)."
}
```
