import React, { useState } from 'react';
import { X, Share2, Globe, Copy, Check, ExternalLink, Rocket, Laptop, Smartphone } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  // The active shared/dev URLs
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-hephfglraefmc6kq633qva-148109333870.asia-east1.run.app';
  const sharedUrl = currentOrigin.includes('localhost') 
    ? 'https://ais-pre-hephfglraefmc6kq633qva-148109333870.asia-east1.run.app' 
    : currentOrigin;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-amber-500 rounded-xl p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-arcade text-base sm:text-lg">HƯỚNG DẪN DEPLOY & CHIA SẺ LINK</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs sm:text-sm">
          {/* Method 1: Instant AI Studio Share Link (Easiest & Fastest) */}
          <div className="bg-gradient-to-r from-amber-950/70 to-zinc-900 border border-amber-500/70 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-arcade text-xs">
              <Share2 className="w-4 h-4" />
              <span>CÁCH 1: LẤY LINK CHIA SẺ TRỰC TIẾP TRÊN GOOGLE AI STUDIO (NHANH NHẤT)</span>
            </div>

            <p className="text-zinc-300 leading-relaxed">
              Ngay trong giao diện Google AI Studio, ứng dụng đã được chạy trực tiếp trên máy chủ Cloud Run. Bạn có thể gửi link này cho bạn bè mở trên máy tính, điện thoại hoặc máy tính bảng để chơi ngay mà không cần cài đặt gì:
            </p>

            <div className="bg-black/70 border border-zinc-700 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 truncate w-full">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 text-xs font-mono truncate">{sharedUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(sharedUrl, 'share')}
                className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-arcade text-xs font-bold rounded flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                {copied === 'share' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>ĐÃ SAO CHÉP!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>CHÉP LINK GỬI BẠN BÈ</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>💡</span>
              <span>
                Bạn cũng có thể bấm vào nút <strong>"Share"</strong> ở góc trên bên phải màn hình AI Studio để bật chế độ công khai hoặc lấy link nhúng.
              </span>
            </div>
          </div>

          {/* Method 2: Deploy to Render.com / Railway / Cloud Run (Hỗ trợ 100% Chơi 2 người WebSocket) */}
          <div className="bg-zinc-850 border border-zinc-700/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-arcade text-xs">
              <Laptop className="w-4 h-4" />
              <span>CÁCH 2: DEPLOY LÊN RENDER.COM HOẶC RAILWAY (CHƠI 2 NGƯỜI ONLINE ĐẦY ĐỦ)</span>
            </div>

            <p className="text-zinc-300 leading-relaxed text-xs">
              Vì game có tính năng <strong>chơi 2 người qua mạng thời gian thực (WebSockets)</strong>, bạn cần dịch vụ có máy chủ Node.js chạy liên tục:
            </p>

            <div className="bg-black/60 p-3 rounded-lg border border-zinc-800 space-y-2 text-xs">
              <div className="text-amber-400 font-arcade text-[11px]">KHUYẾN NGHỊ: RENDER.COM (MIỄN PHÍ 100% & CỰC DỄ)</div>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 pl-1 text-[11px]">
                <li>Xuất mã nguồn: Bấm menu góc phải AI Studio &rarr; chọn <strong>Export to GitHub</strong>.</li>
                <li>Đăng nhập <strong className="text-white">render.com</strong> &rarr; Chọn <strong>New +</strong> &rarr; <strong>Web Service</strong>.</li>
                <li>Kết nối với kho GitHub vừa tạo.</li>
                <li>Cấu hình:
                  <div className="mt-1 ml-4 font-mono text-[10px] text-emerald-300 bg-zinc-950 p-2 rounded">
                    <div>• Environment: <strong>Node</strong></div>
                    <div>• Build Command: <code className="text-amber-300 font-bold">npm install && npm run build</code></div>
                    <div>• Start Command: <code>npm start</code></div>
                  </div>
                </li>
                <li>Bấm <strong>Create Web Service</strong> &rarr; Xong! Bạn sẽ có link HTTPS & WebSocket chơi 2 người vĩnh viễn.</li>
              </ol>
            </div>

            <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 text-[11px] text-zinc-400">
              ⚠️ <strong>Lưu ý về Vercel & GitHub Pages:</strong>
              <div className="mt-1 text-zinc-400">
                - <strong>GitHub Pages:</strong> Chỉ hỗ trợ web tĩnh (HTML/JS), không có máy chủ nên không chạy được tính năng chơi 2 người qua mạng.<br/>
                - <strong>Vercel:</strong> Chạy theo mô hình Serverless không duy trì kết nối WebSocket liên tục.<br/>
                &rarr; Do đó để trải nghiệm đầy đủ cả chơi 1 người và 2 người online, <strong>Render.com</strong> hoặc <strong>Cloud Run</strong> là lựa chọn tối ưu nhất!
              </div>
            </div>
          </div>

          {/* Device compatibility notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/60 flex items-start gap-2.5">
              <Laptop className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-arcade text-[10px] mb-0.5">CHƠI TRÊN MÁY TÍNH (PC/LAPTOP)</strong>
                <p className="text-zinc-400 text-[11px]">
                  Điều khiển bằng bàn phím (WASD/Mũi tên, J/Z bắn, K/X nhảy) hoặc cắm tay cầm Gamepad (PlayStation, Xbox) tự nhận diện 100%.
                </p>
              </div>
            </div>

            <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/60 flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-arcade text-[10px] mb-0.5">CHƠI TRÊN ĐIỆN THOẠI (SMARTPHONE)</strong>
                <p className="text-zinc-400 text-[11px]">
                  Giao diện tự động kích hoạt bàn phím ảo D-Pad 8 hướng và các nút A, B cảm ứng mượt mà. Xoay ngang màn hình để trải nghiệm tốt nhất!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-arcade text-xs font-bold rounded shadow"
          >
            ĐÓNG HƯỚNG DẪN
          </button>
        </div>
      </div>
    </div>
  );
};
