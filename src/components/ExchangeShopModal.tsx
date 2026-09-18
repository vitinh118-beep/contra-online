import React, { useState } from 'react';
import { ContraGameEngine } from '../game/engine';
import { audio } from '../game/audio';
import { 
  Store, 
  X, 
  Fish, 
  Dog, 
  Users, 
  Sparkles, 
  Shield, 
  Heart, 
  Zap, 
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ExchangeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: ContraGameEngine;
  onRefresh: () => void;
}

export const ExchangeShopModal: React.FC<ExchangeShopModalProps> = ({
  isOpen,
  onClose,
  engine,
  onRefresh,
}) => {
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const { fishes, pets, civilians } = engine.inventory;
  const p1 = engine.players[0];

  const handleExchange = (dealId: string, successText: string) => {
    const success = engine.exchangeItem(dealId);
    if (success) {
      setLastMessage(`✅ ${successText}`);
      onRefresh();
    } else {
      setLastMessage('❌ Bạn không đủ số lượng vật phẩm hoặc nhân vật chưa sẵn sàng!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border-2 border-amber-600/80 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-arcade text-white">
        {/* Header */}
        <div className="bg-zinc-950 border-b border-amber-800/80 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-amber-400">
            <Store className="w-5 h-5" />
            <h2 className="text-sm font-bold tracking-wider uppercase">
              CHỢ THƯƠNG GIA & BẢO TỒN ĐỘNG VẬT
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inventory Status Bar */}
        <div className="bg-amber-950/30 border-b border-amber-900/50 px-5 py-3 flex items-center justify-around gap-2 text-xs">
          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-sky-800">
            <Fish className="w-4 h-4 text-sky-400" />
            <span className="text-zinc-300">CÁ BẮT ĐƯỢC:</span>
            <span className="text-sky-400 font-bold text-sm">{fishes}</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-amber-800">
            <Dog className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300">THÚ NUÔI / CHÓ / KHỈ:</span>
            <span className="text-amber-400 font-bold text-sm">{pets}</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300">DÂN GIẢI CỨU:</span>
            <span className="text-emerald-400 font-bold text-sm">{civilians}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-zinc-300">
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            Trong các vòng chơi ở sông nước, sa mạc và rừng núi, bạn có thể nhảy bắt cá, thuần hóa chó/khỉ cưng hoặc cứu người dân. Tại đây bạn có thể trao đổi lấy vũ khí tối tân, thêm mạng hoặc khiên bất tử!
          </p>

          {lastMessage && (
            <div className="p-2.5 rounded bg-zinc-950 border border-amber-500 text-amber-300 text-[11px] text-center font-bold">
              {lastMessage}
            </div>
          )}

          {/* Deals Grid */}
          <div className="space-y-3">
            {/* Deal 1: Sell Fish for Spread Gun */}
            <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 hover:border-red-500/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">[S] SÚNG ĐẠN CHÙM</span>
                  <span className="text-white font-bold">Đổi 2 Cá Tươi</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Nhận ngay Súng Spread Gun bắn tỏa 5 tia uy lực bậc nhất + 1,500 điểm thưởng!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange('sell_fish_weapon', 'Đã đổi 2 cá tươi lấy Súng Đạn Chùm [S] + 1500 điểm!')}
                disabled={fishes < 2}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded text-[11px] font-bold shrink-0 shadow-sm"
              >
                ĐỔI (2 CÁ)
              </button>
            </div>

            {/* Deal 2: Sell Fish for Laser Gun */}
            <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 hover:border-cyan-500/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">[L] SÚNG TIA LASER</span>
                  <span className="text-white font-bold">Đổi 2 Cá Tươi</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Trang bị tia Laser năng lượng cao xuyên thủng nhiều kẻ thù + 2,000 điểm thưởng!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange('sell_fish_laser', 'Đã đổi 2 cá tươi lấy Súng Laser [L] + 2000 điểm!')}
                disabled={fishes < 2}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded text-[11px] font-bold shrink-0 shadow-sm"
              >
                ĐỔI (2 CÁ)
              </button>
            </div>

            {/* Deal 3: Rescue Pet for 1-UP Extra Life */}
            <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-white" /> +1 MẠNG SỐNG (1-UP)
                  </span>
                  <span className="text-white font-bold">Bàn giao 2 Thú Nuôi</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Đưa thú nuôi vào khu bảo tồn an toàn, thưởng ngay 1 mạng hồi sinh + 2,500 điểm!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange('rescue_pet_life', 'Tuyệt vời! Đã nhận thêm 1 Mạng Hồi Sinh (1-UP) + 2500 điểm!')}
                disabled={pets < 2}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded text-[11px] font-bold shrink-0 shadow-sm"
              >
                ĐỔI (2 THÚ)
              </button>
            </div>

            {/* Deal 4: Pet Barrier Shield */}
            <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 hover:border-teal-500/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-teal-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> KHIÊN BẤT TỬ 15S
                  </span>
                  <span className="text-white font-bold">1 Thú Nuôi</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Kích hoạt lá chắn năng lượng 15 giây miễn nhiễm toàn bộ đạn và va chạm địch!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange('rescue_pet_barrier', 'Đã kích hoạt Khiên Bất Tử 15 giây!')}
                disabled={pets < 1}
                className="bg-teal-600 hover:bg-teal-500 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded text-[11px] font-bold shrink-0 shadow-sm"
              >
                ĐỔI (1 THÚ)
              </button>
            </div>

            {/* Deal 5: Reward Civilian */}
            <div className="bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> THƯỞNG ANH HÙNG
                  </span>
                  <span className="text-white font-bold">1 Dân Làng</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Chính quyền thưởng 5,000 điểm + Thêm 1 mạng + Quét sạch lính địch trên màn hình!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange('reward_civilian', 'Anh hùng! Nhận 5000 điểm, +1 Mạng và dọn sạch lính địch!')}
                disabled={civilians < 1}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded text-[11px] font-bold shrink-0 shadow-sm"
              >
                NHẬN THƯỞNG (1 DÂN)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-amber-900/60 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-1.5 rounded text-xs transition-colors"
          >
            TIẾP TỤC CHIẾN ĐẤU
          </button>
        </div>
      </div>
    </div>
  );
};
