import React, { useRef, useCallback } from 'react';
import { InputState } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, ChevronDown } from 'lucide-react';

interface TouchControlsProps {
  inputState: InputState;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ inputState }) => {
  const dpadRef = useRef<HTMLDivElement>(null);

  // Handle D-Pad touch positioning for 8-way directional tracking
  const handleTouchDpad = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!dpadRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      const deadzone = 14;
      if (dist < deadzone) {
        inputState.left = false;
        inputState.right = false;
        inputState.up = false;
        inputState.down = false;
        return;
      }

      const angle = Math.atan2(dy, dx); // radians from -PI to +PI

      // 8-way sector segmentation
      // Right: ~0, Down-Right: PI/4, Down: PI/2, Down-Left: 3PI/4, Left: PI, Up-Left: -3PI/4, Up: -PI/2, Up-Right: -PI/4
      const sector = Math.round((angle / (Math.PI / 4)) + 8) % 8;

      inputState.right = sector === 0 || sector === 1 || sector === 7;
      inputState.left = sector === 3 || sector === 4 || sector === 5;
      inputState.down = sector === 1 || sector === 2 || sector === 3;
      inputState.up = sector === 5 || sector === 6 || sector === 7;
    },
    [inputState]
  );

  const handleTouchEndDpad = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      inputState.left = false;
      inputState.right = false;
      inputState.up = false;
      inputState.down = false;
    },
    [inputState]
  );

  return (
    <div className="w-full flex items-end justify-between px-4 pb-4 sm:px-8 sm:pb-6 select-none touch-none pointer-events-auto">
      {/* 8-Way D-Pad on Left */}
      <div className="flex flex-col items-center">
        <div
          ref={dpadRef}
          onTouchStart={handleTouchDpad}
          onTouchMove={handleTouchDpad}
          onTouchEnd={handleTouchEndDpad}
          onTouchCancel={handleTouchEndDpad}
          className="relative w-32 h-32 sm:w-40 sm:h-40 bg-black/60 border-2 border-white/20 rounded-full shadow-2xl flex items-center justify-center backdrop-blur-sm active:bg-black/80 transition-colors"
        >
          {/* Visual Cross */}
          <div className="absolute w-10 sm:w-12 h-28 sm:h-34 bg-white/10 border border-white/10 rounded-lg flex flex-col justify-between items-center py-2 pointer-events-none">
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </div>
          <div className="absolute w-28 sm:w-34 h-10 sm:h-12 bg-white/10 border border-white/10 rounded-lg flex justify-between items-center px-2 pointer-events-none">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </div>
          {/* Center thumbpad */}
          <div className="w-10 h-10 bg-zinc-800 border border-zinc-600 rounded-full shadow-inner flex items-center justify-center z-10 pointer-events-none">
            <div className="w-4 h-4 bg-zinc-900 rounded-full" />
          </div>
        </div>
        <span className="text-[10px] font-arcade text-zinc-400 mt-1">D-PAD (8 HƯỚNG)</span>
      </div>

      {/* Quick Platform Drop Button */}
      <div className="flex flex-col items-center mb-2">
        <button
          type="button"
          onTouchStart={e => {
            e.preventDefault();
            inputState.down = true;
            inputState.jump = true;
          }}
          onTouchEnd={e => {
            e.preventDefault();
            inputState.down = false;
            inputState.jump = false;
          }}
          className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-600 rounded-lg text-[10px] font-arcade text-zinc-300 flex items-center gap-1 shadow-md active:scale-95 transition-transform"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>TỤT TẦNG</span>
        </button>
      </div>

      {/* Action Controls on Right: B (Shoot) & A (Jump) */}
      <div className="flex items-end gap-4 sm:gap-6">
        {/* Fire Button (B) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onTouchStart={e => {
              e.preventDefault();
              inputState.shoot = true;
            }}
            onTouchEnd={e => {
              e.preventDefault();
              inputState.shoot = false;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/80 hover:bg-red-500/80 active:bg-red-700/90 border-2 border-red-400 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <Crosshair className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <span className="text-[11px] font-arcade text-red-400 font-bold mt-1">B (BẮN)</span>
        </div>

        {/* Jump Button (A) */}
        <div className="flex flex-col items-center -mt-6">
          <button
            type="button"
            onTouchStart={e => {
              e.preventDefault();
              inputState.jump = true;
            }}
            onTouchEnd={e => {
              e.preventDefault();
              inputState.jump = false;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/80 hover:bg-amber-400/80 active:bg-amber-600/90 border-2 border-amber-300 rounded-full shadow-2xl flex items-center justify-center text-black font-arcade text-lg sm:text-xl font-black active:scale-95 transition-transform"
          >
            A
          </button>
          <span className="text-[11px] font-arcade text-amber-400 font-bold mt-1">A (NHẢY)</span>
        </div>
      </div>
    </div>
  );
};
