import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ContraGameEngine } from '../game/engine';
import { GameMode, GameStatus, GameDifficulty } from '../types';
import { audio } from '../game/audio';
import { Play, Users, Sparkles, RefreshCw, Trophy, Gauge, ShieldAlert } from 'lucide-react';

interface ContraCanvasProps {
  engine: ContraGameEngine;
  showCRT: boolean;
  onStatusChange?: (status: GameStatus) => void;
  onOpenInstructions: () => void;
  onOpenMultiplayer?: () => void;
}

export const ContraCanvas: React.FC<ContraCanvasProps> = ({
  engine,
  showCRT,
  onStatusChange,
  onOpenInstructions,
  onOpenMultiplayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus>(engine.status);
  const [menuSelection, setMenuSelection] = useState<GameMode>('1P');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [startWith30Lives, setStartWith30Lives] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 960, height: 540 });

  // Handle Container Responsive Sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetRatio = 16 / 9;
      let w = rect.width;
      let h = rect.width / targetRatio;

      if (h > rect.height) {
        h = rect.height;
        w = rect.height * targetRatio;
      }

      setDimensions({ width: Math.floor(w), height: Math.floor(h) });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on user gesture
      audio.enableAudio();

      // Pass key to Konami detector
      engine.handleKeyDown(e.key);

      // Pause toggle
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (engine.status === 'playing') {
          engine.status = 'paused';
          setCurrentStatus('paused');
          onStatusChange?.('paused');
          audio.stopBGM();
        } else if (engine.status === 'paused') {
          engine.status = 'playing';
          setCurrentStatus('playing');
          onStatusChange?.('playing');
          audio.startBGM();
        }
        return;
      }

      // Route inputs based on network role:
      // In Guest mode, the local player is Player 2 (Lance), so primary keys control p2Input
      const targetInput = engine.isNetworkGuest ? engine.p2Input : engine.p1Input;

      // Player Primary Keys (Arrows / WASD, J/Z Shoot, K/X Jump)
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          targetInput.up = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          targetInput.down = true;
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          targetInput.left = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          targetInput.right = true;
          e.preventDefault();
          break;
        case 'KeyJ':
        case 'KeyZ':
        case 'Space':
          targetInput.shoot = true;
          e.preventDefault();
          break;
        case 'KeyK':
        case 'KeyX':
          targetInput.jump = true;
          e.preventDefault();
          break;

        // Secondary / Local P2 Keys (Numpad 8 4 5 6 or IJKL, U shoot, I jump)
        case 'Numpad8':
        case 'KeyI':
          engine.p2Input.up = true;
          e.preventDefault();
          break;
        case 'Numpad5':
        case 'Numpad2':
          if (engine.mode === '2P') engine.p2Input.down = true;
          break;
        case 'Numpad4':
          engine.p2Input.left = true;
          e.preventDefault();
          break;
        case 'Numpad6':
          engine.p2Input.right = true;
          e.preventDefault();
          break;
        case 'Numpad1':
        case 'KeyU':
          engine.p2Input.shoot = true;
          e.preventDefault();
          break;
        case 'Numpad0':
        case 'KeyO':
          engine.p2Input.jump = true;
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const targetInput = engine.isNetworkGuest ? engine.p2Input : engine.p1Input;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          targetInput.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          targetInput.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          targetInput.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          targetInput.right = false;
          break;
        case 'KeyJ':
        case 'KeyZ':
        case 'Space':
          targetInput.shoot = false;
          break;
        case 'KeyK':
        case 'KeyX':
          targetInput.jump = false;
          break;

        // Player 2
        case 'Numpad8':
        case 'KeyI':
          engine.p2Input.up = false;
          break;
        case 'Numpad5':
        case 'Numpad2':
          engine.p2Input.down = false;
          break;
        case 'Numpad4':
          engine.p2Input.left = false;
          break;
        case 'Numpad6':
          engine.p2Input.right = false;
          break;
        case 'Numpad1':
        case 'KeyU':
          engine.p2Input.shoot = false;
          break;
        case 'Numpad0':
        case 'KeyO':
          engine.p2Input.jump = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onStatusChange]);

  // Main 60 FPS Locked Canvas Game Loop + Gamepad Polling
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_STEP = 1000 / 60; // 16.6667ms per physics tick

    const loop = (currentTime: number) => {
      // Delta time capped to 100ms to avoid spiral of death on tab switch
      const frameDelta = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;
      accumulator += frameDelta;

      // Poll Web Gamepad API for controller inputs
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads[0]) {
        const gp = gamepads[0];
        // D-Pad or Left Stick
        engine.p1Input.left = gp.axes[0] < -0.4 || gp.buttons[14]?.pressed;
        engine.p1Input.right = gp.axes[0] > 0.4 || gp.buttons[15]?.pressed;
        engine.p1Input.up = gp.axes[1] < -0.4 || gp.buttons[12]?.pressed;
        engine.p1Input.down = gp.axes[1] > 0.4 || gp.buttons[13]?.pressed;
        // A (Jump - Button 0) and X/B (Shoot - Button 2 or 1)
        engine.p1Input.jump = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed;
        engine.p1Input.shoot = gp.buttons[2]?.pressed || gp.buttons[3]?.pressed;
      }

      // Run fixed 60Hz updates
      let updates = 0;
      while (accumulator >= FIXED_STEP && updates < 4) {
        engine.update(FIXED_STEP);
        accumulator -= FIXED_STEP;
        updates++;
      }
      if (updates >= 4) {
        accumulator = 0;
      }

      // Render to internal 480x270 virtual canvas buffer
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, engine.viewWidth, engine.viewHeight);
          engine.render(ctx);
        }
      }

      // Sync status with React state if changed
      if (engine.status !== currentStatus) {
        setCurrentStatus(engine.status);
        onStatusChange?.(engine.status);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, currentStatus, onStatusChange]);

  // Start game handler
  const handleStartGame = useCallback(
    (mode: GameMode, lives: number, diff: GameDifficulty = difficulty) => {
      audio.enableAudio();
      engine.start(mode, lives, diff, 0);
      setCurrentStatus('playing');
      onStatusChange?.('playing');
    },
    [engine, difficulty, onStatusChange]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
    >
      {/* Game Canvas */}
      <div
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="relative shadow-2xl bg-zinc-950 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={engine.viewWidth}
          height={engine.viewHeight}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* CRT Scanline and curvature filter overlay */}
        {showCRT && <div className="absolute inset-0 crt-scanlines crt-flicker pointer-events-none" />}

        {/* 1. TITLE SCREEN OVERLAY */}
        {currentStatus === 'title' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-white font-arcade z-20">
            {/* Title Logo */}
            <div className="text-center mb-6">
              <div className="text-5xl sm:text-7xl font-black tracking-widest text-red-600 drop-shadow-[0_4px_16px_rgba(220,38,38,0.8)] animate-pulse">
                CONTRA
              </div>
              <div className="text-xs sm:text-sm tracking-[0.25em] text-yellow-400 mt-1">
                ARCADE 1987 REMASTERED
              </div>
            </div>

            {/* Menu Options */}
            <div className="w-full max-w-xs space-y-3 mb-6 text-xs">
              {/* Player 1 / Player 2 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMenuSelection('1P')}
                  className={`py-2 px-3 rounded border flex items-center justify-center gap-2 transition-colors ${
                    menuSelection === '1P'
                      ? 'bg-red-600/90 border-yellow-400 text-white shadow-lg'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>1 NGƯỜI (BILL)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuSelection('2P')}
                  className={`py-2 px-3 rounded border flex items-center justify-center gap-2 transition-colors ${
                    menuSelection === '2P'
                      ? 'bg-red-600/90 border-yellow-400 text-white shadow-lg'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>2 NGƯỜI (CÙNG PHÍM)</span>
                </button>
              </div>

              {/* Online / LAN 2-Player Button */}
              {onOpenMultiplayer && (
                <button
                  type="button"
                  onClick={onOpenMultiplayer}
                  className="w-full py-2 px-3 rounded border border-red-500/80 bg-red-950/40 hover:bg-red-900/60 text-red-300 flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-3.5 h-3.5 text-red-400" />
                    <span>CHƠI 2 NGƯỜI (LAN / ONLINE)</span>
                  </div>
                  <span className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded font-arcade">
                    MỞ PHÒNG
                  </span>
                </button>
              )}

              {/* 30 Lives Toggle */}
              <button
                type="button"
                onClick={() => setStartWith30Lives(!startWith30Lives)}
                className={`w-full py-2 px-3 rounded border flex items-center justify-between transition-colors ${
                  startWith30Lives
                    ? 'bg-amber-950/80 border-yellow-500 text-yellow-400'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>MÃ KONAMI: 30 MẠNG</span>
                </div>
                <span className="text-[10px] font-bold">
                  {startWith30Lives ? '[BẬT]' : '[TẮT - 3 MẠNG]'}
                </span>
              </button>

              {/* Difficulty Selection */}
              <div className="bg-zinc-900/80 border border-zinc-700 p-2 rounded">
                <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1.5 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>ĐỘ KHÓ</span>
                  </div>
                  <span className={`text-[10px] ${
                    difficulty === 'easy' ? 'text-emerald-400' : difficulty === 'normal' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {difficulty === 'easy' ? 'DỄ (5 MẠNG)' : difficulty === 'normal' ? 'CHUẨN (3 MẠNG)' : 'ARCADE PRO'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'easy'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    DỄ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('normal')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'normal'
                        ? 'bg-yellow-950 border-yellow-500 text-yellow-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    CHUẨN
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'hard'
                        ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    KHÓ
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleStartGame(menuSelection, startWith30Lives ? 30 : (difficulty === 'easy' ? 5 : 3), difficulty)}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-xl shadow-red-600/40 active:scale-95 transition-transform flex items-center gap-2 text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                VÀO TRẬN (START GAME)
              </button>

              <button
                type="button"
                onClick={onOpenInstructions}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs border border-zinc-700"
              >
                HƯỚNG DẪN & PHÍM BẤM
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 mt-6 tracking-wider">
              © 1987 KONAMI / REMASTERED ARCADE WEB EDITION
            </div>
          </div>
        )}

        {/* 2. PAUSE SCREEN OVERLAY */}
        {currentStatus === 'paused' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-white font-arcade z-20">
            <div className="text-3xl text-yellow-400 font-bold mb-4 animate-pulse tracking-widest">
              PAUSE
            </div>
            <div className="text-xs text-zinc-400 mb-6 text-center">
              Trò chơi đang tạm dừng. Bấm phím P hoặc nút TIẾP TỤC để chơi.
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  engine.status = 'playing';
                  setCurrentStatus('playing');
                  onStatusChange?.('playing');
                  audio.startBGM();
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded font-bold shadow-lg"
              >
                TIẾP TỤC
              </button>
              <button
                type="button"
                onClick={() => {
                  engine.status = 'title';
                  setCurrentStatus('title');
                  onStatusChange?.('title');
                  audio.stopBGM();
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded border border-zinc-700"
              >
                VỀ MENU CHÍNH
              </button>
            </div>
          </div>
        )}

        {/* 3. GAME OVER OVERLAY */}
        {currentStatus === 'game_over' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-white font-arcade z-20 text-center">
            <div className="text-4xl text-red-600 font-black mb-2 drop-shadow-[0_2px_10px_rgba(220,38,38,0.7)]">
              GAME OVER
            </div>
            <div className="text-xs text-zinc-400 mb-1">
              ĐIỂM SỐ ĐẠT ĐƯỢC: {engine.players[0]?.score || 0}
            </div>
            <div className="text-xs text-yellow-400 mb-6">
              KỶ LỤC CAO NHẤT: {engine.highScore}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleStartGame(engine.mode, difficulty === 'easy' ? 5 : 3, difficulty)}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs rounded font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                CHƠI LẠI
              </button>
              <button
                type="button"
                onClick={() => handleStartGame(engine.mode, 30, difficulty)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                TIẾP TỤC VỚI 30 MẠNG
              </button>
            </div>
          </div>
        )}

        {/* 4. VICTORY OVERLAY */}
        {currentStatus === 'victory' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-white font-arcade z-20 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-3 animate-bounce" />
            <div className="text-3xl text-yellow-400 font-bold mb-2">
              CHIẾN THẮNG!
            </div>
            <div className="text-xs text-zinc-300 mb-2 max-w-sm">
              BẠN ĐÃ TIÊU DIỆT TOÀN BỘ CĂN CỨ VÀ TRÙM RED FALCON ĐỂ GIẢI CỨU TRÁI ĐẤT!
            </div>
            <div className="text-sm text-red-500 mb-6 font-bold">
              TỔNG ĐIỂM: {engine.players[0]?.score || 0}
            </div>

            <button
              type="button"
              onClick={() => {
                engine.status = 'title';
                setCurrentStatus('title');
              }}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded shadow-lg"
            >
              VỀ MENU CHÍNH
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
