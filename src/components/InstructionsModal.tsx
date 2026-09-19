import React from 'react';
import { X, Gamepad2, Keyboard, Sparkles, Shield, Flame, Crosshair } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger30Lives: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  onTrigger30Lives,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-red-600 rounded-xl p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-arcade text-lg">CONTRA ARCADE</span>
            <span className="text-zinc-400 text-xs font-arcade">CẨM NANG CHIẾN ĐẤU</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-5 text-sm">
          {/* Konami Code Banner */}
          <div className="bg-gradient-to-r from-yellow-950/80 to-amber-950/80 border border-yellow-500/80 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-400 font-arcade text-xs">
                <Sparkles className="w-4 h-4" />
                MÃ BẢO BỐI KONAMI (30 MẠNG)
              </div>
              <div className="font-arcade text-xs text-white tracking-widest bg-black/60 px-2 py-1 rounded inline-block">
                ↑ ↑ ↓ ↓ ← → ← → B A
              </div>
              <p className="text-xs text-zinc-300">
                Nhập chuỗi phím trên bàn phím lúc chơi hoặc bấm nút kích hoạt ngay:
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onTrigger30Lives();
                onClose();
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-arcade text-xs font-bold rounded shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            >
              KÍCH HOẠT 30 MẠNG
            </button>
          </div>

          {/* Controls Table */}
          <div>
            <h3 className="text-xs font-arcade text-sky-400 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" /> PHÍM ĐIỀU KHIỂN (KEYBOARD & GAMEPAD)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700">
                <span className="text-sky-300 font-bold block mb-1">NGƯỜI CHƠI 1 (BILL - Áo Xanh)</span>
                <ul className="space-y-1 text-zinc-300">
                  <li><strong className="text-white">Di chuyển:</strong> Phím mũi tên (Arrow Keys) hoặc WASD</li>
                  <li><strong className="text-white">Bắn (Fire):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">J</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Z</kbd></li>
                  <li><strong className="text-white">Nhảy (Jump):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">K</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">X</kbd> (Nhảy cao thoát nước/vượt chướng ngại)</li>
                  <li><strong className="text-white">Nằm / Lặn né đạn:</strong> Giữ phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">↓</kbd> (Down / S) — lặn sâu dưới nước tránh đạn hoàn toàn</li>
                  <li><strong className="text-white">Nhảy tụt tầng:</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">↓</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">Nhảy</kbd></li>
                </ul>
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700">
                <span className="text-red-300 font-bold block mb-1">NGƯỜI CHƠI 2 (LANCE - Áo Đỏ)</span>
                <ul className="space-y-1 text-zinc-300">
                  <li><strong className="text-white">Di chuyển:</strong> Numpad 8 4 5 6 hoặc I J K L</li>
                  <li><strong className="text-white">Bắn (Fire):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">U</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Num 1</kbd></li>
                  <li><strong className="text-white">Nhảy (Jump):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">I</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Num 2</kbd></li>
                  <li><strong className="text-white">Nằm / Lặn:</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">K</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">Num 5</kbd></li>
                  <li><strong className="text-white">Tạm dừng (Pause):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">P</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">ESC</kbd></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Weapon Power-Ups */}
          <div>
            <h3 className="text-xs font-arcade text-red-400 mb-2 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" /> KHO VŨ KHÍ & VẬT PHẨM
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-red-950/40 border border-red-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-red-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">S</span>
                <div>
                  <strong className="text-white block">Spread Gun</strong>
                  <span className="text-[11px] text-zinc-300">Đạn chùm 5 tia cực mạnh</span>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-amber-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">M</span>
                <div>
                  <strong className="text-white block">Machine Gun</strong>
                  <span className="text-[11px] text-zinc-300">Súng liên thanh tốc độ cao</span>
                </div>
              </div>

              <div className="bg-cyan-950/40 border border-cyan-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-cyan-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">L</span>
                <div>
                  <strong className="text-white block">Laser Gun</strong>
                  <span className="text-[11px] text-zinc-300">Tia laser xuyên mục tiêu</span>
                </div>
              </div>

              <div className="bg-orange-950/40 border border-orange-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-orange-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">F</span>
                <div>
                  <strong className="text-white block">Flame Gun</strong>
                  <span className="text-[11px] text-zinc-300">Cầu lửa xoáy sát thương lớn</span>
                </div>
              </div>

              <div className="bg-sky-950/40 border border-sky-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-sky-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">B</span>
                <div>
                  <strong className="text-white block">Barrier</strong>
                  <span className="text-[11px] text-zinc-300">Khiên hộ thể bất tử 15 giây</span>
                </div>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-yellow-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">!</span>
                <div>
                  <strong className="text-white block">Bomb Capsule</strong>
                  <span className="text-[11px] text-zinc-300">Quét sạch toàn bộ kẻ địch</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Tips & New Features */}
          <div className="bg-zinc-800/40 border border-zinc-700/60 p-3.5 rounded-lg text-xs text-zinc-300 space-y-2">
            <strong className="text-yellow-400 block font-arcade text-[11px]">TÍNH NĂNG MỚI ĐẶC BIỆT & MẸO CHIẾN ĐẤU:</strong>
            <p>• <strong className="text-sky-300">Lặn Nước Siêu Cấp:</strong> Khi lội qua các khúc sông nước hoặc biển, giữ phím <kbd className="px-1 bg-zinc-700 rounded">↓</kbd> (hoặc <kbd className="px-1 bg-zinc-700 rounded">S</kbd>) để lặn sâu dưới nước; bong bóng nước sẽ nổi lên và bạn hoàn toàn miễn nhiễm với đạn bay trên mặt nước!</p>
            <p>• <strong className="text-amber-300">Nhảy Cao Tăng Cường:</strong> Lực nhảy đã được tăng cường giúp Bill & Lance dễ dàng phi thân thoát khỏi nước lên các vách đất cao mà không sợ hụt rơi xuống vực.</p>
            <p>• <strong className="text-emerald-300">Động Vật & Người Dân Sinh Động:</strong> Các màn chơi xuất hiện chó cưng chạy nhảy, khỉ rừng tinh nghịch, đàn cá nhảy lượn trên mặt nước, và người dân đội nón lá vẫy chào. Đụng vào để thu thập cá và thú cưng!</p>
            <p>• <strong className="text-purple-300">Chợ Đổi Thưởng:</strong> Nhấn nút "CHỢ ĐỔI THƯỞNG" trên thanh công cụ để đổi cá lấy Súng Đạn Chùm [S], tia Laser [L], hay giao thú cưng nhận 1-UP Thêm Mạng và Khiên Bất Tử!</p>
            <p>• <strong className="text-red-400">Tải Ảnh Mặt Làm Trùm Cuối & Nhạc Tâm Trạng:</strong> Bấm nút "TRÙM & NHẠC" để upload ảnh bất kỳ người nào làm Boss Core, cùng 4 chế độ nhạc (Hùng tráng, Boss Rush, Rừng sâu, Thư thái) hoặc tải file MP3 của riêng bạn!</p>
            <p>• <strong className="text-zinc-300">Cảnh Quan Địa Danh:</strong> Khám phá 5 màn chơi phong cảnh nổi tiếng: Rừng Tây Nguyên & Thác Dray Nur, Đồi Cát Mũi Né & Tháp Chàm, Vịnh Hạ Long biển ngọc, Đô thị Sài Gòn Cyberpunk (Landmark 81, Bitexco), và Kỳ quan Hang Sơn Đoòng!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-amber-400 font-arcade">
            TÁC GIẢ & PHÁT TRIỂN: <strong className="text-white">HẢI HOÀNG (0918001944)</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 font-arcade text-xs text-white rounded shadow cursor-pointer"
          >
            ĐÃ HIỂU, VÀO TRẬN!
          </button>
        </div>
      </div>
    </div>
  );
};
