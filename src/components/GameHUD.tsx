import React from 'react';
import { Player, WeaponType, BossStatus } from '../types';
import { Shield, Zap, Sparkles, Fish, Dog, Users, Store, Settings, Skull, AlertTriangle } from 'lucide-react';

interface GameHUDProps {
  players: Player[];
  highScore: number;
  stageName: string;
  stageSubtitle: string;
  stageNumber: number;
  konamiActive: boolean;
  bossStatus?: BossStatus;
  inventory?: {
    fishes: number;
    pets: number;
    civilians: number;
  };
  onOpenShop?: () => void;
  onOpenSettings?: () => void;
}

const WEAPON_NAMES: Record<WeaponType, { name: string; color: string; desc: string }> = {
  R: { name: 'RIFLE', color: 'bg-zinc-700 text-zinc-200 border-zinc-500', desc: 'Standard semi-auto' },
  M: { name: 'MACHINE', color: 'bg-amber-600 text-white border-amber-400', desc: 'Rapid automatic fire' },
  S: { name: 'SPREAD', color: 'bg-red-600 text-white border-red-400 shadow-red-500/50', desc: '5-way fan spread shot' },
  L: { name: 'LASER', color: 'bg-cyan-600 text-white border-cyan-300', desc: 'Piercing high-energy beam' },
  F: { name: 'FLAME', color: 'bg-orange-600 text-white border-orange-400', desc: 'Rotating fireball burst' },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  players,
  highScore,
  stageName,
  stageSubtitle,
  stageNumber,
  konamiActive,
  bossStatus,
  inventory = { fishes: 0, pets: 0, civilians: 0 },
  onOpenShop,
  onOpenSettings,
}) => {
  const p1 = players[0];
  const p2 = players[1];

  return (
    <div className="w-full bg-black/95 border-b-2 border-zinc-800 px-3 sm:px-6 py-2 text-white font-arcade select-none">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Player 1 Section */}
        {p1 && (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-sky-400 font-bold tracking-wider text-[11px]">1P BILL</span>
              <span className="text-white text-base tracking-widest leading-tight">
                {p1.score.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Lives badge */}
            <div className="flex items-center gap-1 bg-sky-950/70 border border-sky-600/70 px-2 py-1 rounded">
              <span className="text-zinc-400 text-[10px]">MẠNG</span>
              <span className="text-yellow-400 font-bold text-sm sm:text-base">{Math.max(0, p1.lives)}</span>
            </div>

            {/* Active Weapon */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-bold ${
                WEAPON_NAMES[p1.weapon].color
              }`}
              title={WEAPON_NAMES[p1.weapon].desc}
            >
              <span>[{p1.weapon}]</span>
              <span className="hidden md:inline">{WEAPON_NAMES[p1.weapon].name}</span>
            </div>

            {/* Barrier / Invincibility active */}
            {p1.barrierTime > 0 && (
              <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded animate-pulse text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">BẤT TỬ</span>
              </div>
            )}
          </div>
        )}

        {/* Center High Score & Stage Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-xs">HI</span>
            <span className="text-yellow-400 tracking-widest text-base">
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>

          {/* Current Stage Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 tracking-wide mt-0.5">
            <span className="text-red-400 font-bold">VÒNG {stageNumber}:</span>
            <span className="text-zinc-300">{stageName.split(':')[1] || stageName}</span>
          </div>
        </div>

        {/* Inventory & Pet/Civilian Rescue Badges & Shop Button */}
        <div className="flex items-center gap-2">
          {/* Collectible Items Pill */}
          <button
            type="button"
            onClick={onOpenShop}
            title="Bấm để mở Chợ Đổi Thưởng & Trao Đổi Thú Nuôi/Cá/Dân"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-600/70 px-2.5 py-1 rounded text-[11px] transition-colors"
          >
            <div className="flex items-center gap-1 text-sky-400" title="Cá đã bắt">
              <Fish className="w-3.5 h-3.5" />
              <span>{inventory.fishes}</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1 text-amber-400" title="Thú cưng thuần hóa">
              <Dog className="w-3.5 h-3.5" />
              <span>{inventory.pets}</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1 text-emerald-400" title="Người dân đã cứu">
              <Users className="w-3.5 h-3.5" />
              <span>{inventory.civilians}</span>
            </div>
            <div className="ml-1 bg-amber-600 text-white px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5">
              <Store className="w-2.5 h-2.5" />
              <span>CHỢ</span>
            </div>
          </button>

          {/* Player 2 or Konami */}
          {p2 ? (
            <div className="flex items-center gap-2 text-right">
              <span className="text-red-400 font-bold text-[11px]">2P</span>
              <span className="text-white text-xs">{p2.score}</span>
              <span className="text-yellow-400 text-xs">x{p2.lives}</span>
            </div>
          ) : (
            konamiActive && (
              <div className="hidden sm:flex items-center gap-1 bg-yellow-950/60 border border-yellow-500 text-yellow-400 px-2 py-1 rounded text-xs">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>30 MẠNG</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Boss Battle Health Bar & Depletion Percentage */}
      {bossStatus && bossStatus.isActive && (
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-red-900/60 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-full flex items-center justify-between text-[11px] mb-1 px-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className={bossStatus.isFinalBoss ? 'text-red-400' : 'text-amber-400'}>
                {bossStatus.isFinalBoss ? '⚠️ TRÙM CUỐI:' : '⚠️ TRÙM:'} {bossStatus.name}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-zinc-400 text-[10px]">
                {bossStatus.hp} / {bossStatus.maxHp} HP
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  bossStatus.defeated
                    ? 'bg-emerald-500 text-white'
                    : bossStatus.hpPercent <= 20
                    ? 'bg-red-600 text-white animate-pulse'
                    : bossStatus.hpPercent <= 50
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {bossStatus.defeated
                  ? 'TIÊU DIỆT 100%!'
                  : `CÒN ${bossStatus.hpPercent}% (ĐÃ DIỆT ${bossStatus.damageDealtPercent}%)`}
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-zinc-950 border border-red-600/70 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                bossStatus.hpPercent <= 20
                  ? 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
                  : bossStatus.hpPercent <= 50
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-300'
              }`}
              style={{ width: `${bossStatus.hpPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
