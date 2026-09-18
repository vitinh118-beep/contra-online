/**
 * Contra Arcade Web App
 * Authentic NES style Contra run-and-gun arcade game
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ContraGameEngine } from './game/engine';
import { GameHUD } from './components/GameHUD';
import { ContraCanvas } from './components/ContraCanvas';
import { TouchControls } from './components/TouchControls';
import { InstructionsModal } from './components/InstructionsModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { ExchangeShopModal } from './components/ExchangeShopModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { network } from './game/network';
import { audio } from './game/audio';
import { 
  Volume2, 
  VolumeX, 
  Tv, 
  HelpCircle, 
  Share2, 
  Maximize, 
  Sparkles, 
  Gamepad2, 
  RotateCcw,
  Smartphone,
  ExternalLink,
  Settings,
  Store,
  Music,
  Users,
  Wifi
} from 'lucide-react';

export default function App() {
  const engine = useMemo(() => new ContraGameEngine(), []);
  const [showCRT, setShowCRT] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showDeployGuide, setShowDeployGuide] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showExchangeShop, setShowExchangeShop] = useState<boolean>(false);
  const [showMultiplayer, setShowMultiplayer] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState(engine.status);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [hudTick, setHudTick] = useState<number>(0);

  // Auto-detect ?room= in URL to open multiplayer lobby for invited friend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setShowMultiplayer(true);
    }
  }, []);

  // Detect mobile / touch device
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouchControls(isTouchDevice);
  }, []);

  // Sync HUD state periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setHudTick(prev => prev + 1);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Konami Code Quick Trigger
  const handleTrigger30Lives = useCallback(() => {
    engine.activate30Lives();
  }, [engine]);

  // Fullscreen Toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white select-none overflow-hidden">
      {/* Top Arcade Control Header */}
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Title & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center font-arcade text-xs font-black shadow-md shadow-red-600/50">
            C
          </div>
          <h1 className="font-arcade text-xs sm:text-sm text-red-500 tracking-wider">
            CONTRA <span className="text-zinc-400 text-[10px] hidden sm:inline">VIỆT NAM & THẾ GIỚI</span>
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chơi 2 người qua mạng LAN / Internet */}
          <button
            type="button"
            onClick={() => setShowMultiplayer(true)}
            title="Mở phòng chơi 2 người qua mạng LAN hoặc Internet"
            className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/40 border border-red-500 text-red-300 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors shadow-sm animate-pulse cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">CHƠI 2 NGƯỜI (LAN/NET)</span>
            <span className="sm:hidden">2P NET</span>
            {network.roomCode && (
              <span className="px-1.5 py-0.5 bg-red-700 text-white rounded text-[9px] font-mono font-bold">
                {network.roomCode}
              </span>
            )}
          </button>

          {/* Cài đặt Trùm & Âm nhạc Tâm trạng */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Đổi mặt Trùm Cuối (up ảnh) & Chọn nhạc nền theo tâm trạng"
            className="px-2.5 py-1 bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/80 text-purple-300 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">TRÙM & NHẠC</span>
          </button>

          {/* Chợ Đổi Thưởng / Bán thú cưng & Cá */}
          <button
            type="button"
            onClick={() => setShowExchangeShop(true)}
            title="Mở Chợ Trao Đổi: Đổi cá & thú nuôi lấy Súng S, Súng Laser, 1-UP Mạng"
            className="px-2.5 py-1 bg-amber-600/25 hover:bg-amber-600/35 border border-amber-500/80 text-amber-300 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">CHỢ ĐỔI THƯỞNG</span>
          </button>

          {/* Quick 30 Lives Konami Button */}
          <button
            type="button"
            onClick={handleTrigger30Lives}
            title="Kích hoạt 30 mạng (Mã Konami)"
            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/80 text-amber-400 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">30 MẠNG</span>
          </button>

          {/* Deploy & Gửi Link Cho Người Khác Chơi */}
          <button
            type="button"
            onClick={() => setShowDeployGuide(true)}
            title="Xem cách lấy link gửi cho bạn bè chơi cùng"
            className="px-2.5 py-1 bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/80 text-emerald-300 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>GỬI LINK CHƠI</span>
          </button>

          {/* Toggle Touch Controls */}
          <button
            type="button"
            onClick={() => setShowTouchControls(prev => !prev)}
            title="Bật/Tắt phím cảm ứng màn hình"
            className={`p-1.5 rounded border text-xs ${
              showTouchControls
                ? 'bg-sky-600/30 border-sky-500 text-sky-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* CRT Scanline filter toggle */}
          <button
            type="button"
            onClick={() => setShowCRT(prev => !prev)}
            title="Bật/Tắt hiệu ứng màn hình cong CRT cổ điển"
            className={`p-1.5 rounded border text-xs ${
              showCRT
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>

          {/* Instructions Modal */}
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            title="Hướng dẫn chơi & Phím điều khiển"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Toàn màn hình"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors hidden sm:block"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Retro Game HUD (Lives, Score, Weapon, Stage, Animal Inventory, Boss Health) */}
      <GameHUD
        players={engine.players}
        highScore={engine.highScore}
        stageName={engine.currentLevel.name}
        stageSubtitle={engine.currentLevel.subtitle}
        stageNumber={engine.levelIndex + 1}
        konamiActive={engine.konamiActivated}
        bossStatus={engine.getBossStatus()}
        inventory={engine.inventory}
        onOpenShop={() => setShowExchangeShop(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Canvas Game Area */}
      <main className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        <ContraCanvas
          engine={engine}
          showCRT={showCRT}
          onStatusChange={setGameStatus}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
        />

        {/* Floating Virtual Touch Controls (on mobile or enabled) */}
        {showTouchControls && gameStatus === 'playing' && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30">
            <TouchControls inputState={engine.isNetworkGuest ? engine.p2Input : engine.p1Input} />
          </div>
        )}
      </main>

      {/* Desktop Quick Controls Legend Footer */}
      <footer className="h-8 bg-zinc-950 border-t border-zinc-800/80 px-4 flex items-center justify-between text-[10px] text-zinc-400 font-arcade shrink-0">
        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
          <span><kbd className="text-zinc-200">WASD / Mũi tên</kbd>: Di chuyển</span>
          <span><kbd className="text-amber-400 font-bold">J / Z</kbd>: Bắn</span>
          <span><kbd className="text-amber-400 font-bold">K / X</kbd>: Nhảy cao</span>
          <span><kbd className="text-sky-300 font-bold">Dưới nước + Giữ S/↓</kbd>: Lặn né đạn</span>
          <span><kbd className="text-zinc-200">↓ + Nhảy</kbd>: Tụt tầng</span>
          <span><kbd className="text-zinc-200">P</kbd>: Tạm dừng</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDeployGuide(true)}
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
            <span>LẤY LINK GỬI BẠN BÈ</span>
          </button>
          <span>•</span>
          <div className="flex items-center gap-1 text-zinc-500">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>GAMEPAD READY</span>
          </div>
        </div>
      </footer>

      {/* Instructions & Help Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onTrigger30Lives={handleTrigger30Lives}
      />

      {/* Deploy & Share Guide Modal */}
      <DeployGuideModal
        isOpen={showDeployGuide}
        onClose={() => setShowDeployGuide(false)}
      />

      {/* Custom Boss Face & Music Mood Settings Modal */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        engine={engine}
      />

      {/* Animal & Civilian Exchange Shop Modal */}
      <ExchangeShopModal
        isOpen={showExchangeShop}
        onClose={() => setShowExchangeShop(false)}
        engine={engine}
        onRefresh={() => setHudTick(prev => prev + 1)}
      />

      {/* 2-Player LAN & Internet Multiplayer Lobby Modal */}
      <MultiplayerModal
        isOpen={showMultiplayer}
        onClose={() => setShowMultiplayer(false)}
        engine={engine}
        onStartMultiplayerGame={() => setGameStatus('playing')}
      />
    </div>
  );
}
