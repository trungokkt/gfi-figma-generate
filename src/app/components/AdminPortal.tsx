import { useState } from "react";
import {
  LayoutDashboard, Building2, CreditCard, MessageSquare,
  Gamepad2, LayoutTemplate, ChevronRight, TrendingUp,
  Users, AlertCircle, CheckCircle, XCircle, Clock,
  Plus, Edit, Trash2, MoreVertical, Search, Filter,
  BarChart3, Settings, Bell, LogOut, Shield
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";

const revenueData = [
  { month: "T1", revenue: 42000000, merchants: 28 },
  { month: "T2", revenue: 58000000, merchants: 34 },
  { month: "T3", revenue: 71000000, merchants: 41 },
  { month: "T4", revenue: 65000000, merchants: 38 },
  { month: "T5", revenue: 89000000, merchants: 52 },
  { month: "T6", revenue: 112000000, merchants: 67 },
];

const merchants = [
  { id: "M001", name: "Coca-Cola Vietnam", code: "COCAVN", plan: "Enterprise", status: "ACTIVE", players: 48200, sms: 12400, joined: "15/01/2026" },
  { id: "M002", name: "Vinamilk", code: "VMLK", plan: "Pro", status: "ACTIVE", players: 32100, sms: 8900, joined: "22/02/2026" },
  { id: "M003", name: "TH True Milk", code: "THTM", plan: "Growth", status: "GRACE_PERIOD", players: 8750, sms: 210, joined: "05/03/2026" },
  { id: "M004", name: "Masan Consumer", code: "MSAN", plan: "Pro", status: "ACTIVE", players: 41200, sms: 15600, joined: "10/03/2026" },
  { id: "M005", name: "Trung Nguyen Coffee", code: "TNCF", plan: "Growth", status: "SUSPENDED", players: 9100, sms: 0, joined: "01/04/2026" },
  { id: "M006", name: "Sabeco", code: "SABC", plan: "Free", status: "ACTIVE", players: 38, sms: 22, joined: "28/05/2026" },
  { id: "M007", name: "Biti's Hunter", code: "BTSH", plan: "Growth", status: "ACTIVE", players: 6200, sms: 3400, joined: "15/05/2026" },
];

const plans = [
  { name: "Free", price: 0, players: 50, sms: 50, merchants: 12, color: "#7B7F96" },
  { name: "Growth", price: 79, players: 10000, sms: 10000, merchants: 34, color: "#06B6D4" },
  { name: "Pro", price: 299, players: 50000, sms: 50000, merchants: 18, color: "#7C3AED" },
  { name: "Enterprise", price: null, players: -1, sms: -1, merchants: 3, color: "#F59E0B" },
];

const gameTemplates = [
  { id: 1, name: "Vòng Quay May Mắn", type: "LUCKY_WHEEL", campaigns: 42, active: true },
  { id: 2, name: "Đổi Quà Tích Lũy", type: "REDEMPTION", campaigns: 28, active: true },
  { id: 3, name: "Lật Hình Bí Ẩn", type: "FLIP_CARD", campaigns: 0, active: false },
  { id: 4, name: "Quay Slot Machine", type: "SLOT_MACHINE", campaigns: 0, active: false },
];

const campaignTemplates = [
  { id: 1, name: "Template Tết Bính Ngọ 2026", tier: "Premium", campaigns: 18, color: "#D32F2F" },
  { id: 2, name: "Template Hè Rực Rỡ", tier: "Basic", campaigns: 31, color: "#F59E0B" },
  { id: 3, name: "Template Khai Giảng 2026", tier: "Basic", campaigns: 14, color: "#06B6D4" },
  { id: 4, name: "Template 8/3 Phụ Nữ", tier: "Premium", campaigns: 22, color: "#EC4899" },
  { id: 5, name: "Template Vu Lan Báo Hiếu", tier: "Basic", campaigns: 9, color: "#10B981" },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "merchants", label: "Doanh nghiệp", icon: Building2 },
  { id: "plans", label: "Gói dịch vụ", icon: CreditCard },
  { id: "sms", label: "Hạn mức SMS", icon: MessageSquare },
  { id: "games", label: "Thư viện Game", icon: Gamepad2 },
  { id: "templates", label: "Template Chiến dịch", icon: LayoutTemplate },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    ACTIVE: { label: "Hoạt động", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
    GRACE_PERIOD: { label: "Ân hạn", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Clock },
    SUSPENDED: { label: "Tạm khóa", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  };
  const s = map[status] || map.ACTIVE;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${s.color}`}>
      <Icon size={10} />
      {s.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Free: "text-gray-400 bg-gray-400/10 border-gray-400/20",
    Growth: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    Pro: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    Enterprise: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${colors[plan] || colors.Free}`}>
      {plan}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-xl font-semibold text-foreground leading-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1">Tổng quan hệ thống</h2>
        <p className="text-sm text-muted-foreground">Gamification SaaS Platform — Cập nhật lúc 09:41 09/06/2026</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Tổng doanh nghiệp" value="67" sub="↑ 12 tháng này" icon={Building2} color="#7C3AED" />
        <StatCard label="Người chơi hoạt động" value="148,392" sub="Across all merchants" icon={Users} color="#06B6D4" />
        <StatCard label="Doanh thu tháng 6" value="112M VND" sub="↑ 25.8% so với T5" icon={TrendingUp} color="#10B981" />
        <StatCard label="SMS đã gửi (T6)" value="84,210" sub="15,790 SMS còn lại" icon={MessageSquare} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-foreground">Doanh thu & Doanh nghiệp mới theo tháng</h3>
            <span className="text-xs text-muted-foreground">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#7B7F96", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1A1D30", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${(v / 1000000).toFixed(0)}M VND`, "Doanh thu"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm text-foreground mb-4">Phân bổ gói dịch vụ</h3>
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="text-foreground font-medium">{p.merchants} merchants</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(p.merchants / 67) * 100}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle size={12} />
              <span>2 merchants đang trong Grace Period</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm text-foreground">Doanh nghiệp gần đây</h3>
          <button className="text-xs text-primary hover:text-primary/80">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Doanh nghiệp", "Gói dịch vụ", "Trạng thái", "Người chơi", "SMS dư", "Tham gia"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {merchants.slice(0, 5).map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground text-xs">{m.name}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>{m.code}</div>
                  </td>
                  <td className="px-5 py-3"><PlanBadge plan={m.plan} /></td>
                  <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3 text-xs text-foreground font-mono">{m.players.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: m.sms < 500 ? "#EF4444" : "#10B981" }}>{m.sms.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{m.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MerchantsView() {
  const [search, setSearch] = useState("");
  const filtered = merchants.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Quản lý Doanh nghiệp</h2>
          <p className="text-sm text-muted-foreground">67 doanh nghiệp đang đăng ký</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Thêm doanh nghiệp
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, mã..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="flex items-center gap-2 bg-secondary border border-border text-muted-foreground px-3 py-2 rounded-lg text-sm hover:text-foreground">
          <Filter size={14} /> Lọc
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                {["ID", "Doanh nghiệp", "Gói dịch vụ", "Trạng thái", "Người chơi", "SMS dư", "Ngày tham gia", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors group">
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{m.id}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground text-xs">{m.name}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>{m.code}.gfi.vn</div>
                  </td>
                  <td className="px-5 py-3"><PlanBadge plan={m.plan} /></td>
                  <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3 text-xs font-mono text-foreground">{m.players.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: m.sms < 500 ? "#EF4444" : m.sms < 2000 ? "#F59E0B" : "#10B981" }}>
                    {m.sms.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{m.joined}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"><Edit size={13} /></button>
                      <button className="p-1 hover:bg-red-400/10 rounded text-muted-foreground hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlansView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Gói Dịch Vụ SaaS</h2>
          <p className="text-sm text-muted-foreground">Quản lý cấu hình và định giá các gói đăng ký</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Thêm gói mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div key={p.name} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}20` }}>
                <CreditCard size={14} style={{ color: p.color }} />
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded text-muted-foreground">
                <Edit size={13} />
              </button>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{p.name}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: p.color }}>
                {p.price === null ? "Liên hệ" : p.price === 0 ? "Miễn phí" : `$${p.price}/tháng`}
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người chơi</span>
                <span className="text-foreground font-mono">{p.players === -1 ? "Không giới hạn" : p.players.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SMS miễn phí</span>
                <span className="text-foreground font-mono">{p.sms === -1 ? "Tùy chỉnh" : p.sms.toLocaleString()}/tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đang dùng</span>
                <span className="font-medium" style={{ color: p.color }}>{p.merchants} merchants</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              {p.name === "Free" && "Template Basic • Gateway chung"}
              {p.name === "Growth" && "Template Premium • Gateway chung"}
              {p.name === "Pro" && "Template Premium • Gateway riêng"}
              {p.name === "Enterprise" && "Full access • SLA tùy chỉnh"}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm text-foreground mb-4">Lịch sử giao dịch gần đây</h3>
        <div className="space-y-2">
          {[
            { merchant: "Vinamilk", type: "SUBSCRIPTION_RENEW", amount: "6,935,000 VND", plan: "Pro", date: "09/06/2026", status: "SUCCESS" },
            { merchant: "Biti's Hunter", type: "SMS_ADDON", amount: "300,000 VND", plan: "Growth", date: "08/06/2026", status: "SUCCESS" },
            { merchant: "TH True Milk", type: "SUBSCRIPTION_RENEW", amount: "1,736,000 VND", plan: "Growth", date: "07/06/2026", status: "FAILED" },
            { merchant: "Masan Consumer", type: "SUBSCRIPTION_RENEW", amount: "6,935,000 VND", plan: "Pro", date: "05/06/2026", status: "SUCCESS" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${t.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                <div>
                  <span className="text-xs text-foreground">{t.merchant}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t.type === "SUBSCRIPTION_RENEW" ? "Gia hạn gói" : "Nạp SMS"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <PlanBadge plan={t.plan} />
                <span className="text-foreground font-mono">{t.amount}</span>
                <span className="text-muted-foreground">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamesView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Thư viện Game Plugin</h2>
          <p className="text-sm text-muted-foreground">Quản lý danh mục trò chơi bổ trợ cho nền tảng</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Thêm game mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameTemplates.map((g) => (
          <div key={g.id} className={`bg-card border rounded-xl p-5 ${g.active ? "border-primary/30" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${g.active ? "bg-primary/20" : "bg-secondary"}`}>
                  <Gamepad2 size={18} className={g.active ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{g.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{g.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${g.active ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-gray-500 bg-gray-500/10 border-gray-500/20"}`}>
                  {g.active ? "Đang dùng" : "Chưa ra mắt"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đang dùng trong <span className="text-foreground font-mono">{g.campaigns}</span> chiến dịch</span>
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"><Edit size={12} /></button>
                <button className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"><Settings size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Thư viện Template Chiến dịch</h2>
          <p className="text-sm text-muted-foreground">Quản lý các mẫu chiến dịch dành cho merchants</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Tạo template mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaignTemplates.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
            <div className="h-24 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.color }}>
                <LayoutTemplate size={20} className="text-white" />
              </div>
              <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded border ${t.tier === "Premium" ? "text-amber-400 bg-amber-400/10 border-amber-400/30" : "text-cyan-400 bg-cyan-400/10 border-cyan-400/30"}`}>
                {t.tier}
              </span>
            </div>
            <div className="p-4">
              <div className="text-sm font-medium text-foreground mb-1">{t.name}</div>
              <div className="text-xs text-muted-foreground mb-3">Đã dùng trong <span className="text-foreground">{t.campaigns}</span> chiến dịch</div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 text-xs bg-secondary border border-border text-muted-foreground py-1.5 rounded-lg hover:text-foreground transition-colors">Xem trước</button>
                <button className="flex-1 text-xs bg-primary/10 border border-primary/30 text-primary py-1.5 rounded-lg hover:bg-primary/20 transition-colors">Chỉnh sửa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const viewComponents: Record<string, () => JSX.Element> = {
  dashboard: DashboardView,
  merchants: MerchantsView,
  plans: PlansView,
  games: GamesView,
  templates: TemplatesView,
};

export function AdminPortal() {
  const [activeNav, setActiveNav] = useState("dashboard");

  const ActiveView = viewComponents[activeNav] || DashboardView;

  return (
    <div className="flex h-full bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-sidebar-border flex flex-col" style={{ background: "var(--sidebar)" }}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">GFI Admin</div>
              <div style={{ fontSize: 10, color: "#7B7F96" }}>System Administrator</div>
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
                  isActive
                    ? "bg-primary text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
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
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Admin Portal <span className="text-border mx-1">/</span>
            <span className="text-foreground">{navItems.find(n => n.id === activeNav)?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs text-white font-medium">A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
