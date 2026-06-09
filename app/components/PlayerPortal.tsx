'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone, Lock, Eye, EyeOff, Gift, Star, Zap, RotateCcw,
  ChevronRight, CheckCircle, AlertCircle, X, Package,
  Ticket, MapPin, ArrowLeft, Home, Trophy, User, History
} from "lucide-react";

// Lucky Wheel config
const WHEEL_SLICES = [
  { prize: "Voucher 50k", type: "VOUCHER", color: "#7C3AED", probability: 0.05, icon: "🎫" },
  { prize: "50 điểm", type: "POINTS", color: "#06B6D4", probability: 0.20, icon: "⭐" },
  { prize: "Bình nước", type: "PHYSICAL", color: "#10B981", probability: 0.02, icon: "🎁" },
  { prize: "Chúc may mắn", type: "NONE", color: "#374151", probability: 0.40, icon: "🍀" },
  { prize: "Voucher 20k", type: "VOUCHER", color: "#EC4899", probability: 0.08, icon: "🎫" },
  { prize: "30 điểm", type: "POINTS", color: "#F59E0B", probability: 0.15, icon: "⭐" },
  { prize: "Áo thun", type: "PHYSICAL", color: "#EF4444", probability: 0.02, icon: "👕" },
  { prize: "10 điểm", type: "POINTS", color: "#8B5CF6", probability: 0.08, icon: "⭐" },
];

const myPrizes = [
  { id: 1, name: "Voucher giảm 50k", type: "VOUCHER", code: "VMLK50K-XG9", date: "09/06/2026", campaign: "Hè Rực Rỡ 2026" },
  { id: 2, name: "Voucher giảm 20k", type: "VOUCHER", code: "VMLK20K-TR7", date: "07/06/2026", campaign: "Hè Rực Rỡ 2026" },
  { id: 3, name: "Bình giữ nhiệt Premium", type: "PHYSICAL", code: null, date: "05/06/2026", campaign: "Khai Trương Q7", status: "SHIPPING" },
];

const pointHistory = [
  { type: "EARNED", amount: 50, desc: "Nhập mã GFI2026X", date: "09/06/2026" },
  { type: "SPENT", amount: -20, desc: "Quay Vòng may mắn", date: "09/06/2026" },
  { type: "EARNED", amount: 30, desc: "Nhập mã MLKHE2026", date: "08/06/2026" },
  { type: "SPENT", amount: -20, desc: "Quay Vòng may mắn", date: "07/06/2026" },
  { type: "EARNED", amount: 50, desc: "Nhập mã VMHQ1234", date: "07/06/2026" },
];

type Screen = "login" | "register" | "otp" | "home" | "wheel" | "prizes" | "history" | "shipping";

function WheelCanvas({ isSpinning, targetSlice }: { isSpinning: boolean; targetSlice: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 4000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    const sliceAngle = (2 * Math.PI) / WHEEL_SLICES.length;

    function draw(angle: number) {
      ctx.clearRect(0, 0, size, size);

      // Draw slices
      WHEEL_SLICES.forEach((slice, i) => {
        const start = i * sliceAngle + angle;
        const end = start + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon/text
        const midAngle = start + sliceAngle / 2;
        const tx = cx + (r * 0.62) * Math.cos(midAngle);
        const ty = cy + (r * 0.62) * Math.sin(midAngle);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const words = slice.prize.split(" ");
        words.forEach((w, wi) => {
          ctx.fillText(w, 0, wi * 11 - ((words.length - 1) * 11) / 2);
        });
        ctx.restore();
      });

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#0C0E1A";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#7C3AED";
      ctx.font = "bold 11px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GFI", cx, cy);
    }

    if (isSpinning) {
      const targetAngle = -(targetSlice * sliceAngle + sliceAngle / 2) + Math.PI / 2;
      const extraSpins = 5 * 2 * Math.PI;
      const totalAngle = extraSpins + targetAngle - (angleRef.current % (2 * Math.PI));

      const startAngle = angleRef.current;
      startTimeRef.current = null;

      function animate(ts: number) {
        if (!startTimeRef.current) startTimeRef.current = ts;
        const elapsed = ts - startTimeRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        angleRef.current = startAngle + totalAngle * eased;
        draw(angleRef.current);
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    } else {
      draw(angleRef.current);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSpinning, targetSlice]);

  return (
    <div className="relative">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div className="w-0 h-0" style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "18px solid #F59E0B" }} />
      </div>
      <canvas ref={canvasRef} width={260} height={260} className="rounded-full" style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.4))" }} />
    </div>
  );
}

function LoginScreen({ onLogin, onGoRegister }: { onLogin: () => void; onGoRegister: () => void }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-900 flex items-center justify-center mx-auto mb-3">
          <Zap size={28} className="text-white" />
        </div>
        <h1 className="text-foreground text-lg">Đăng nhập</h1>
        <p className="text-muted-foreground text-xs mt-1">Hè Rực Rỡ 2026 · Vinamilk</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Số điện thoại</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              defaultValue="0901234567"
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Mật khẩu</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              defaultValue="password123"
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nhập mật khẩu"
            />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onLogin}
        className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
      >
        Đăng nhập
      </button>

      <div className="text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{" "}
        <button onClick={onGoRegister} className="text-primary hover:underline">Đăng ký ngay</button>
      </div>
    </div>
  );
}

function RegisterScreen({ onGoOtp, onGoLogin }: { onGoOtp: () => void; onGoLogin: () => void }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button onClick={onGoLogin} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-foreground text-base">Đăng ký tài khoản</h1>
          <p className="text-muted-foreground text-xs">Xác thực qua SMS OTP</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Số điện thoại *</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nhập số điện thoại" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Mật khẩu *</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type={showPw ? "text" : "password"} className="w-full bg-secondary border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Tạo mật khẩu mạnh" />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye size={14} /></button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3">
        <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-primary" />
        <span>Mã OTP sẽ được gửi qua SMS đến số của bạn. Tối đa 3 lần/5 phút.</span>
      </div>

      <button
        onClick={onGoOtp}
        className="w-full py-3 rounded-xl text-white text-sm font-medium"
        style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
      >
        Gửi mã OTP
      </button>
    </div>
  );
}

function OTPScreen({ onVerify, onBack }: { onVerify: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const t = setInterval(() => setTimer(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-foreground text-base">Xác thực OTP</h1>
          <p className="text-muted-foreground text-xs">Nhập mã 6 chữ số đã gửi đến 0901••••567</p>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { if (el) inputsRef.current[i] = el; }}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            maxLength={1}
            className="w-11 h-12 text-center text-lg font-mono text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        {timer > 0 ? (
          <span>Gửi lại sau <span className="text-primary font-mono">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span></span>
        ) : (
          <button className="text-primary hover:underline" onClick={() => setTimer(120)}>Gửi lại OTP</button>
        )}
      </div>

      <button
        onClick={onVerify}
        className="w-full py-3 rounded-xl text-white text-sm font-medium"
        style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
      >
        Xác nhận
      </button>
    </div>
  );
}

function HomeScreen({ onGoWheel, points }: { onGoWheel: () => void; points: number }) {
  const [code, setCode] = useState("");
  const [codeResult, setCodeResult] = useState<null | { success: boolean; msg: string; pts?: number }>(null);
  const [loading, setLoading] = useState(false);

  function submitCode() {
    if (code.length !== 8) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeResult({ success: true, msg: "Nạp mã thành công! Bạn được cộng 50 điểm.", pts: 50 });
      setCode("");
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Campaign header */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "white", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: "white", transform: "translate(-30%, 30%)" }} />
        <div className="relative">
          <div className="text-xs opacity-75 mb-1">Hè Rực Rỡ 2026 · Vinamilk</div>
          <div className="text-3xl font-bold mb-1">{points} <span className="text-lg font-normal opacity-75">điểm</span></div>
          <div className="text-xs opacity-75">Còn đến 31/07/2026 · 20 điểm/lượt quay</div>
        </div>
      </div>

      {/* Code entry */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Ticket size={15} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Nhập mã dự thưởng</span>
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase().slice(0, 8)); setCodeResult(null); }}
            placeholder="VD: GFI2026X"
            className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal"
          />
          <button
            onClick={submitCode}
            disabled={code.length !== 8 || loading}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
          >
            {loading ? "..." : "Nạp"}
          </button>
        </div>
        <div className="text-xs text-muted-foreground">8 ký tự in hoa và số · Tối đa 5 lần sai/15 phút</div>

        <AnimatePresence>
          {codeResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-2 text-xs rounded-xl p-3 ${codeResult.success ? "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400" : "bg-red-400/10 border border-red-400/20 text-red-400"}`}
            >
              {codeResult.success ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
              {codeResult.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Play button */}
      <button
        onClick={onGoWheel}
        className="w-full py-4 rounded-2xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}
      >
        <RotateCcw size={18} /> Quay Vòng May Mắn · 20 điểm/lượt
      </button>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-xl font-bold text-primary">12</div>
          <div className="text-xs text-muted-foreground">Mã đã nhập</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-xl font-bold text-amber-400">3</div>
          <div className="text-xs text-muted-foreground">Quà đã trúng</div>
        </div>
      </div>
    </div>
  );
}

function WheelScreen({ points, onBack, onWin }: { points: number; onBack: () => void; onWin: (prize: typeof WHEEL_SLICES[0]) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [targetSlice, setTargetSlice] = useState(0);
  const [result, setResult] = useState<typeof WHEEL_SLICES[0] | null>(null);
  const COST = 20;

  function spin() {
    if (spinning || points < COST) return;
    setResult(null);
    // Weighted random
    const rand = Math.random();
    let acc = 0;
    let chosen = 0;
    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      acc += WHEEL_SLICES[i].probability;
      if (rand < acc) { chosen = i; break; }
    }
    setTargetSlice(chosen);
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setResult(WHEEL_SLICES[chosen]);
      onWin(WHEEL_SLICES[chosen]);
    }, 4200);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><ArrowLeft size={16} /></button>
        <span className="text-sm text-foreground">Vòng Quay May Mắn</span>
        <div className="text-xs text-primary font-mono">{points} điểm</div>
      </div>

      <div className="relative mt-2">
        <WheelCanvas isSpinning={spinning} targetSlice={targetSlice} />
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`w-full rounded-2xl p-4 text-center ${result.type === "NONE" ? "bg-secondary border border-border" : "border"}`}
            style={result.type !== "NONE" ? { background: `${result.color}15`, borderColor: `${result.color}40` } : {}}
          >
            <div className="text-2xl mb-1">{result.icon}</div>
            <div className="text-sm font-medium text-foreground">{result.type === "NONE" ? "Chúc may mắn lần sau!" : `🎉 Chúc mừng!`}</div>
            {result.type !== "NONE" && <div className="text-xs mt-0.5" style={{ color: result.color }}>{result.prize}</div>}
            {result.type === "PHYSICAL" && (
              <div className="text-xs text-muted-foreground mt-2">Vui lòng điền thông tin nhận quà trong mục "Hộp quà"</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={spin}
        disabled={spinning || points < COST}
        className="w-full py-4 rounded-2xl text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100"
        style={{ background: spinning ? "#374151" : "linear-gradient(135deg, #F59E0B, #EF4444)" }}
      >
        {spinning ? "Đang quay..." : points < COST ? `Không đủ điểm (cần ${COST})` : `🎡 Quay ngay · ${COST} điểm`}
      </button>
    </div>
  );
}

function PrizesScreen({ onNeedAddress }: { onNeedAddress: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-foreground text-base">Hộp Quà Của Tôi</h2>
      <div className="space-y-3">
        {myPrizes.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${p.type === "VOUCHER" ? "bg-violet-400/15" : "bg-emerald-400/15"}`}>
                {p.type === "VOUCHER" ? "🎫" : "🎁"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.campaign} · {p.date}</div>
                {p.code && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs bg-secondary border border-border rounded-lg px-2 py-1 text-primary font-mono">{p.code}</code>
                    <span className="text-xs text-muted-foreground">Đã gửi qua SMS</span>
                  </div>
                )}
                {p.status && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 rounded border text-cyan-400 bg-cyan-400/10 border-cyan-400/20">
                      {p.status === "SHIPPING" ? "Đang giao hàng" : p.status}
                    </span>
                  </div>
                )}
                {p.type === "PHYSICAL" && !p.status && (
                  <button onClick={onNeedAddress} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                    <MapPin size={11} /> Điền địa chỉ nhận quà
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><ArrowLeft size={16} /></button>
        <div>
          <h2 className="text-foreground text-base">Thông Tin Nhận Quà</h2>
          <p className="text-xs text-muted-foreground">Bình giữ nhiệt Premium</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        {[
          { label: "Họ và tên *", placeholder: "Nguyễn Văn A" },
          { label: "Số điện thoại *", placeholder: "0901 234 567" },
          { label: "Địa chỉ chi tiết *", placeholder: "Số nhà, tên đường" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
            <input className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder={f.placeholder} />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {[["Tỉnh/Thành *", "TP. Hồ Chí Minh"], ["Quận/Huyện *", "Quận 1"], ["Phường/Xã *", "Bến Nghé"]].map(([l, p]) => (
            <div key={l}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{l}</label>
              <select className="w-full bg-secondary border border-border rounded-xl px-2 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option>{p}</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onBack} className="w-full py-3.5 rounded-2xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}>
        Xác nhận địa chỉ nhận quà
      </button>
    </div>
  );
}

function HistoryScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-foreground text-base">Lịch Sử Điểm</h2>
      <div className="space-y-2">
        {pointHistory.map((h, i) => (
          <div key={i} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${h.type === "EARNED" ? "bg-emerald-400/15" : "bg-red-400/15"}`}>
                {h.type === "EARNED" ? <Star size={13} className="text-emerald-400" /> : <Zap size={13} className="text-red-400" />}
              </div>
              <div>
                <div className="text-xs text-foreground">{h.desc}</div>
                <div className="text-xs text-muted-foreground">{h.date}</div>
              </div>
            </div>
            <span className={`text-sm font-mono font-semibold ${h.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {h.amount > 0 ? "+" : ""}{h.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlayerPortal() {
  const [screen, setScreen] = useState<Screen>("login");
  const [points, setPoints] = useState(90);

  function handleWin(prize: typeof WHEEL_SLICES[0]) {
    if (prize.type === "POINTS") {
      setPoints(p => p + 30);
    } else {
      setPoints(p => Math.max(0, p - 20));
    }
  }

  const screenContent: Record<Screen, JSX.Element> = {
    login: <LoginScreen onLogin={() => setScreen("home")} onGoRegister={() => setScreen("register")} />,
    register: <RegisterScreen onGoOtp={() => setScreen("otp")} onGoLogin={() => setScreen("login")} />,
    otp: <OTPScreen onVerify={() => setScreen("home")} onBack={() => setScreen("register")} />,
    home: <HomeScreen onGoWheel={() => setScreen("wheel")} points={points} />,
    wheel: <WheelScreen points={points} onBack={() => setScreen("home")} onWin={handleWin} />,
    prizes: <PrizesScreen onNeedAddress={() => setScreen("shipping")} />,
    shipping: <ShippingScreen onBack={() => setScreen("prizes")} />,
    history: <HistoryScreen />,
  };

  const isLoggedIn = !["login", "register", "otp"].includes(screen);

  return (
    <div className="h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0C0E1A 0%, #1a0a2e 100%)" }}>
      {/* Phone frame */}
      <div className="w-full max-w-sm h-full max-h-[760px] flex flex-col bg-background rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground font-mono">09:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 border border-muted-foreground rounded-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 bg-emerald-400 rounded-sm" style={{ width: "80%" }} />
            </div>
          </div>
        </div>

        {/* Campaign banner */}
        {!isLoggedIn && (
          <div className="px-5 py-2 flex-shrink-0">
            <div className="rounded-2xl h-24 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED30, #EC489930)" }}>
              <div className="text-center">
                <div className="text-2xl">🎡</div>
                <div className="text-xs text-primary font-medium">Hè Rực Rỡ 2026</div>
                <div className="text-xs text-muted-foreground">Vinamilk × GFI Platform</div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {screenContent[screen]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        {isLoggedIn && screen !== "wheel" && screen !== "shipping" && (
          <div className="flex-shrink-0 border-t border-border">
            <div className="flex items-center pb-4 pt-2">
              {[
                { id: "home", label: "Trang chủ", icon: Home },
                { id: "wheel", label: "Quay thưởng", icon: RotateCcw },
                { id: "prizes", label: "Hộp quà", icon: Gift },
                { id: "history", label: "Lịch sử", icon: History },
              ].map((n) => {
                const Icon = n.icon;
                const active = screen === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setScreen(n.id as Screen)}
                    className="flex-1 flex flex-col items-center gap-1 py-1 transition-colors"
                  >
                    <Icon size={18} style={{ color: active ? "#7C3AED" : "#7B7F96" }} />
                    <span className="text-xs" style={{ color: active ? "#7C3AED" : "#7B7F96", fontSize: 10 }}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
