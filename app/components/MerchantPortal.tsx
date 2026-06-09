import { useState } from "react";
import {
  LayoutDashboard, Megaphone, MessageSquare, Package,
  Settings, ChevronRight, Plus, Upload, Download,
  BarChart3, Users, Clock, CheckCircle, XCircle,
  AlertCircle, LogOut, Bell, Edit, MoreVertical,
  Zap, ToggleLeft, ToggleRight, ArrowUpRight, CreditCard,
  FileText, Truck, Search, Eye
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const campaignStats = [
  { day: "T2", plays: 1240, codes: 342 },
  { day: "T3", plays: 1820, codes: 521 },
  { day: "T4", plays: 2100, codes: 698 },
  { day: "T5", plays: 1650, codes: 441 },
  { day: "T6", plays: 2890, codes: 812 },
  { day: "T7", plays: 3210, codes: 944 },
  { day: "CN", plays: 2980, codes: 876 },
];

const campaigns = [
  { id: "C001", name: "Hè Rực Rỡ 2026", status: "ACTIVE", players: 8420, starts: "01/06/2026", ends: "31/07/2026", template: "Hè Rực Rỡ", games: ["LUCKY_WHEEL"] },
  { id: "C002", name: "Khai Trương Chi Nhánh Q7", status: "ACTIVE", players: 2100, starts: "15/05/2026", ends: "15/06/2026", template: "Custom", games: ["LUCKY_WHEEL", "REDEMPTION"] },
  { id: "C003", name: "Flash Sale Ngày 6/6", status: "ENDED", players: 14800, starts: "06/06/2026", ends: "06/06/2026", template: "Hè Rực Rỡ", games: ["LUCKY_WHEEL"] },
  { id: "C004", name: "Chào Mừng Hè Mới", status: "DRAFT", players: 0, starts: "20/06/2026", ends: "20/07/2026", template: null, games: [] },
];

const fulfillmentOrders = [
  { id: "W001", player: "Nguyễn Văn A", phone: "0901 234 567", prize: "Bình giữ nhiệt Premium", campaign: "Hè Rực Rỡ 2026", status: "PENDING", date: "09/06/2026" },
  { id: "W002", player: "Trần Thị B", phone: "0912 345 678", prize: "Áo thun thương hiệu", campaign: "Hè Rực Rỡ 2026", status: "SHIPPING", tracking: "TRK9988877", provider: "GHTK", date: "08/06/2026" },
  { id: "W003", player: "Lê Văn C", phone: "0923 456 789", prize: "Mũ bảo hiểm", campaign: "Khai Trương Chi Nhánh Q7", status: "DELIVERED", date: "07/06/2026" },
  { id: "W004", player: "Phạm Thị D", phone: "0934 567 890", prize: "Bình giữ nhiệt Premium", campaign: "Hè Rực Rỡ 2026", status: "PENDING", date: "09/06/2026" },
  { id: "W005", player: "Hoàng Văn E", phone: "0945 678 901", prize: "Mũ bảo hiểm", campaign: "Hè Rực Rỡ 2026", status: "FAILED", date: "06/06/2026" },
];

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "campaigns", label: "Chiến dịch", icon: Megaphone },
  { id: "create_campaign", label: "Tạo chiến dịch", icon: Plus },
  { id: "sms_billing", label: "SMS & Thanh toán", icon: MessageSquare },
  { id: "fulfillment", label: "Vận đơn quà tặng", icon: Package },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Đang chạy", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    DRAFT: { label: "Nháp", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
    PAUSED: { label: "Tạm dừng", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    ENDED: { label: "Đã kết thúc", color: "text-muted-foreground bg-secondary border-border" },
  };
  const s = map[status] || map.DRAFT;
  return <span className={`text-xs px-2 py-0.5 rounded border ${s.color}`}>{s.label}</span>;
}

function FulfillmentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ xử lý", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    SHIPPING: { label: "Đang giao", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    DELIVERED: { label: "Đã giao", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    FAILED: { label: "Thất bại", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  };
  const s = map[status] || map.PENDING;
  return <span className={`text-xs px-2 py-0.5 rounded border ${s.color}`}>{s.label}</span>;
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-xl font-semibold text-foreground leading-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {trend && (
        <div className="text-xs text-emerald-400 flex items-center gap-0.5">
          <ArrowUpRight size={12} />{trend}
        </div>
      )}
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-0.5">Tổng quan chiến dịch</h2>
        <p className="text-sm text-muted-foreground">Vinamilk — Gói Pro • 32,100 / 50,000 người chơi</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Người chơi tổng" value="32,100" sub="18,900 slot còn trống" icon={Users} color="#7C3AED" trend="+12%" />
        <StatCard label="SMS còn lại" value="8,900" sub="50,000 đi kèm gói" icon={MessageSquare} color="#06B6D4" />
        <StatCard label="Chiến dịch đang chạy" value="2" sub="1 nháp, 1 đã kết thúc" icon={Megaphone} color="#10B981" />
        <StatCard label="Lượt quay hôm nay" value="3,210" sub="Tổng 7 ngày: 15,890" icon={Zap} color="#F59E0B" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-foreground">Hoạt động 7 ngày qua</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded bg-primary" />Lượt quay</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded bg-cyan-400" />Mã nhập</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={campaignStats}>
              <defs>
                <linearGradient id="gPlays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCodes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#7B7F96", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1A1D30", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="plays" stroke="#7C3AED" strokeWidth={2} fill="url(#gPlays)" name="Lượt quay" />
              <Area type="monotone" dataKey="codes" stroke="#06B6D4" strokeWidth={2} fill="url(#gCodes)" name="Mã nhập" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-foreground">Gói dịch vụ</h3>
              <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded">Pro</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Người chơi</span>
                  <span className="text-foreground">32,100 / 50,000</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: "64.2%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">SMS tháng này</span>
                  <span className="text-foreground">41,100 / 50,000</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "82.2%" }} />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gia hạn</span>
                <span className="text-foreground">01/07/2026</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-amber-400 mb-1">SMS sắp cạn</div>
                <div className="text-xs text-muted-foreground">Còn 8,900 SMS. Nạp thêm để chiến dịch tiếp tục.</div>
                <button className="mt-2 text-xs text-amber-400 border border-amber-400/30 px-3 py-1 rounded-lg hover:bg-amber-400/10">
                  Nạp thêm SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignsView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Chiến dịch Marketing</h2>
          <p className="text-sm text-muted-foreground">Quản lý toàn bộ chiến dịch và cấu hình game</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Tạo chiến dịch
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.status === "ACTIVE" ? "bg-primary/20" : "bg-secondary"}`}>
                  <Megaphone size={16} className={c.status === "ACTIVE" ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {c.starts} → {c.ends}
                    {c.template && <span className="ml-3 text-primary">• Template: {c.template}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users size={11} />{c.players.toLocaleString()} người chơi
                    </span>
                    {c.games.map(g => (
                      <span key={g} className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded">
                        {g === "LUCKY_WHEEL" ? "Vòng quay" : "Đổi quà"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:text-foreground">
                  <Upload size={12} /> Import mã
                </button>
                <button className="flex items-center gap-1.5 text-xs bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:text-foreground">
                  <BarChart3 size={12} /> Báo cáo
                </button>
                <button className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20">
                  <Edit size={12} /> Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCampaignView() {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [games, setGames] = useState({ lucky_wheel: true, redemption: false });

  const templates = [
    { id: "t1", name: "Hè Rực Rỡ", tier: "Basic", color: "#F59E0B", desc: "Vòng quay mùa hè với 8 giải thưởng mẫu" },
    { id: "t2", name: "Tết Bính Ngọ 2026", tier: "Premium", color: "#D32F2F", desc: "Thiết kế Tết truyền thống, tỷ lệ thưởng cao" },
    { id: "t3", name: "Khai Giảng 2026", tier: "Basic", color: "#06B6D4", desc: "Template mùa tựu trường năng động" },
    { id: "t4", name: "Blank (Tự thiết kế)", tier: "Basic", color: "#7C3AED", desc: "Bắt đầu từ trang trắng hoàn toàn" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-foreground">Tạo Chiến dịch Mới</h2>
        <p className="text-sm text-muted-foreground">Thiết lập chiến dịch Marketing tương tác</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[{ n: 1, label: "Thông tin cơ bản" }, { n: 2, label: "Chọn Template" }, { n: 3, label: "Cấu hình Game" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${step === s.n ? "bg-primary/20 border-primary/50 text-primary" : step > s.n ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400" : "bg-secondary border-border text-muted-foreground"}`}
            >
              <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${step === s.n ? "bg-primary text-white" : step > s.n ? "bg-emerald-400 text-white" : "bg-secondary-foreground/20 text-muted-foreground"}`}>
                {step > s.n ? "✓" : s.n}
              </span>
              {s.label}
            </button>
            {i < 2 && <ChevronRight size={12} className="text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Tên chiến dịch *</label>
              <input defaultValue="Chiến dịch Hè Rực Rỡ 2026" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Slug URL</label>
              <input defaultValue="he-ruc-ro-2026" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ngày bắt đầu *</label>
              <input type="date" defaultValue="2026-06-20" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ngày kết thúc *</label>
              <input type="date" defaultValue="2026-07-20" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Mô tả ngắn</label>
            <textarea rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Nhập mô tả chiến dịch..." />
          </div>
          <button onClick={() => setStep(2)} className="bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90">
            Tiếp theo →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <p className="text-xs text-muted-foreground">Chọn template mẫu hoặc tạo chiến dịch từ đầu. Template Premium yêu cầu gói Growth trở lên.</p>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: t.color }}>
                    <span className="text-white" style={{ fontSize: 10 }}>T</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{t.name}</span>
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded border ${t.tier === "Premium" ? "text-amber-400 border-amber-400/30" : "text-cyan-400 border-cyan-400/30"}`}>
                    {t.tier}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="bg-secondary border border-border text-muted-foreground px-5 py-2 rounded-lg text-sm hover:text-foreground">← Quay lại</button>
            <button onClick={() => setStep(3)} className="bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90">Tiếp theo →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <p className="text-xs text-muted-foreground">Bắt buộc bật ít nhất 1 trò chơi bổ trợ.</p>

          {[
            { key: "lucky_wheel", label: "Vòng Quay May Mắn", desc: "Người chơi tiêu điểm để quay vòng quay ngẫu nhiên", icon: "🎡" },
            { key: "redemption", label: "Đổi Quà Tích Lũy", desc: "Người chơi tích điểm đổi quà theo danh mục", icon: "🎁" },
          ].map((g) => (
            <div key={g.key} className={`border rounded-xl p-4 ${games[g.key as keyof typeof games] ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{g.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{g.label}</div>
                    <div className="text-xs text-muted-foreground">{g.desc}</div>
                  </div>
                </div>
                <button onClick={() => setGames(prev => ({ ...prev, [g.key]: !prev[g.key as keyof typeof games] }))}>
                  {games[g.key as keyof typeof games]
                    ? <ToggleRight size={28} className="text-primary" />
                    : <ToggleLeft size={28} className="text-muted-foreground" />}
                </button>
              </div>
              {games[g.key as keyof typeof games] && g.key === "lucky_wheel" && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Điểm / lượt quay</label>
                    <input type="number" defaultValue={20} className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Số ô trúng thưởng</label>
                    <input type="number" defaultValue={8} className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {!games.lucky_wheel && !games.redemption && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle size={13} />
              Chiến dịch cần kích hoạt ít nhất 1 trò chơi bổ trợ để bắt đầu!
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="bg-secondary border border-border text-muted-foreground px-5 py-2 rounded-lg text-sm hover:text-foreground">← Quay lại</button>
            <button
              disabled={!games.lucky_wheel && !games.redemption}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🚀 Phát hành chiến dịch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SMSBillingView() {
  const [quantity, setQuantity] = useState(500);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-foreground">SMS & Thanh toán</h2>
        <p className="text-sm text-muted-foreground">Quản lý số dư SMS và lịch sử thanh toán</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">SMS gói tháng</div>
          <div className="text-2xl font-semibold text-foreground">8,900</div>
          <div className="text-xs text-muted-foreground mt-1">Reset ngày 01/07/2026</div>
          <div className="h-1.5 bg-secondary rounded-full mt-3">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: "17.8%" }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">41,100 / 50,000 đã dùng</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">SMS mua thêm</div>
          <div className="text-2xl font-semibold text-cyan-400">2,150</div>
          <div className="text-xs text-muted-foreground mt-1">Không hết hạn theo tháng</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm text-foreground">Nạp thêm SMS</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">Số lượng SMS</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              step={100}
              min={100}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">Thành tiền</label>
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-primary font-semibold">
              {(quantity * 600).toLocaleString()} VND
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Đơn giá: 600 VND/SMS • Thanh toán qua VNPAY, MoMo, Stripe</div>

        <div className="flex gap-3">
          {["VNPAY", "MOMO", "STRIPE"].map(gw => (
            <button key={gw} className="flex-1 text-xs bg-secondary border border-border text-muted-foreground py-2 rounded-lg hover:border-primary/30 hover:text-foreground transition-colors">
              {gw}
            </button>
          ))}
        </div>

        <button className="w-full bg-primary text-white py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          Thanh toán {(quantity * 600).toLocaleString()} VND
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm text-foreground">Lịch sử giao dịch</h3>
        </div>
        <div className="divide-y divide-border/40">
          {[
            { type: "SMS_ADDON", amount: "300,000 VND", sms: 500, date: "08/06/2026", status: "SUCCESS" },
            { type: "SUBSCRIPTION_RENEW", amount: "6,935,000 VND", sms: null, date: "01/06/2026", status: "SUCCESS" },
            { type: "SMS_ADDON", amount: "600,000 VND", sms: 1000, date: "20/05/2026", status: "SUCCESS" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${t.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                <div>
                  <div className="text-xs text-foreground">{t.type === "SMS_ADDON" ? `Nạp ${t.sms} SMS` : "Gia hạn gói Pro"}</div>
                  <div className="text-xs text-muted-foreground">{t.date}</div>
                </div>
              </div>
              <span className="text-xs text-foreground font-mono">{t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FulfillmentView() {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? fulfillmentOrders : fulfillmentOrders.filter(o => o.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Vận Đơn Quà Tặng</h2>
          <p className="text-sm text-muted-foreground">Quản lý và xử lý quà vật lý cho người chơi</p>
        </div>
        <button className="flex items-center gap-2 bg-secondary border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm hover:text-foreground">
          <Download size={14} /> Export Excel
        </button>
      </div>

      <div className="flex items-center gap-2">
        {["ALL", "PENDING", "SHIPPING", "DELIVERED", "FAILED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ xử lý" : f === "SHIPPING" ? "Đang giao" : f === "DELIVERED" ? "Đã giao" : "Thất bại"}
            {f === "PENDING" && <span className="ml-1.5 text-amber-400 font-mono">
              {fulfillmentOrders.filter(o => o.status === "PENDING").length}
            </span>}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              {["ID", "Người nhận", "Phần thưởng", "Chiến dịch", "Trạng thái", "Ngày", "Hành động"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors group">
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.id}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-foreground">{o.player}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </td>
                <td className="px-4 py-3 text-xs text-foreground">{o.prize}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.campaign}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <FulfillmentBadge status={o.status} />
                    {o.tracking && <div className="text-xs text-muted-foreground font-mono">{o.tracking}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {o.status === "PENDING" && (
                      <button className="text-xs bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-2 py-1 rounded hover:bg-cyan-400/20">
                        <Truck size={11} />
                      </button>
                    )}
                    <button className="text-xs bg-secondary border border-border text-muted-foreground px-2 py-1 rounded hover:text-foreground">
                      <Eye size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const viewComponents: Record<string, () => JSX.Element> = {
  dashboard: DashboardView,
  campaigns: CampaignsView,
  create_campaign: CreateCampaignView,
  sms_billing: SMSBillingView,
  fulfillment: FulfillmentView,
};

export function MerchantPortal() {
  const [activeNav, setActiveNav] = useState("dashboard");

  const ActiveView = viewComponents[activeNav] || DashboardView;

  return (
    <div className="flex h-full bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <aside className="w-56 flex-shrink-0 border-r border-sidebar-border flex flex-col" style={{ background: "var(--sidebar)" }}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white" style={{ fontSize: 11, fontWeight: 700 }}>V</div>
            <div>
              <div className="text-xs font-semibold text-foreground">Vinamilk</div>
              <div style={{ fontSize: 10, color: "#7B7F96" }}>Gói Pro • Merchant Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive ? "bg-primary text-white" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                {item.label}
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-lg bg-secondary/50 text-xs mb-2">
            <div className="text-muted-foreground">SMS còn lại</div>
            <div className="text-amber-400 font-mono font-medium">8,900 + 2,150</div>
          </div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Business Portal <span className="text-border mx-1">/</span>
            <span className="text-foreground">{navItems.find(n => n.id === activeNav)?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs text-white font-medium">V</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
