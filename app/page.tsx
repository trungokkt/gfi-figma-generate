'use client';

import { useState } from 'react';
import { Shield, Building2, Smartphone } from 'lucide-react';
import { AdminPortal } from '@/app/components/AdminPortal';
import { MerchantPortal } from '@/app/components/MerchantPortal';
import { PlayerPortal } from '@/app/components/PlayerPortal';

type Portal = 'admin' | 'merchant' | 'player';

const portals = [
  {
    id: 'admin' as Portal,
    label: 'Admin Portal',
    sublabel: 'Quản trị hệ thống SaaS',
    icon: Shield,
    color: '#7C3AED',
    badge: 'Super Admin',
  },
  {
    id: 'merchant' as Portal,
    label: 'Business Portal',
    sublabel: 'Doanh nghiệp / Merchant',
    icon: Building2,
    color: '#06B6D4',
    badge: 'Vinamilk',
  },
  {
    id: 'player' as Portal,
    label: 'Player Portal',
    sublabel: 'Người chơi (Mobile-first)',
    icon: Smartphone,
    color: '#F59E0B',
    badge: 'End User',
  },
];

function PortalSelector({ onSelect }: { onSelect: (p: Portal) => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: 'linear-gradient(135deg, #0C0E1A 0%, #1a0a2e 50%, #0a1629 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <span className="text-white text-xl font-bold">G</span>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-white tracking-tight">GFI Platform</div>
            <div className="text-xs text-purple-400 font-mono">Gamification SaaS v1.1</div>
          </div>
        </div>

        <p className="text-sm text-gray-400 max-w-md">
          Nền tảng Gamification SaaS — Chọn cổng thông tin để khám phá giao diện
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="group text-left rounded-2xl border p-6 transition-all hover:scale-[1.02] hover:-translate-y-1"
              style={{
                background: 'rgba(19, 22, 38, 0.8)',
                borderColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${p.color}50`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${p.color}20` }}
              >
                <Icon size={22} style={{ color: p.color }} />
              </div>

              <div className="mb-2">
                <div className="text-white font-semibold text-base mb-0.5">{p.label}</div>
                <div className="text-xs text-gray-400">{p.sublabel}</div>
              </div>

              <div
                className="mt-4 text-xs px-2 py-0.5 rounded-md border inline-block"
                style={{ color: p.color, borderColor: `${p.color}30`, background: `${p.color}10` }}
              >
                {p.badge}
              </div>

              <div
                className="mt-4 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: p.color }}
              >
                <span>Vào xem</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 mt-10 flex items-center gap-6 text-xs text-gray-600">
        {['Admin Portal', 'Business Portal', 'Player Portal'].map((l, i) => (
          <span key={l} className="flex items-center gap-2">
            {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-700" />}
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [activePortal, setActivePortal] = useState<Portal | null>(null);

  if (!activePortal) {
    return <PortalSelector onSelect={setActivePortal} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Portal switcher bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
        style={{ background: '#0A0C17', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setActivePortal(null)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 mr-2"
        >
          ← GFI Platform
        </button>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-1 ml-2">
          {portals.map((p) => {
            const Icon = p.icon;
            const isActive = activePortal === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePortal(p.id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all"
                style={{
                  background: isActive ? `${p.color}20` : 'transparent',
                  color: isActive ? p.color : '#4B5563',
                  border: isActive ? `1px solid ${p.color}30` : '1px solid transparent',
                }}
              >
                <Icon size={11} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portal content */}
      <div className="flex-1 overflow-hidden">
        {activePortal === 'admin' && <AdminPortal />}
        {activePortal === 'merchant' && <MerchantPortal />}
        {activePortal === 'player' && <PlayerPortal />}
      </div>
    </div>
  );
}
