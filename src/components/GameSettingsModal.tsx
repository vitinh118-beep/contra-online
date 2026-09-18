import React, { useState, useRef, useEffect } from 'react';
import { ContraGameEngine } from '../game/engine';
import { audio } from '../game/audio';
import { MusicMood, BossFaceConfig } from '../types';
import { 
  Upload, 
  Trash2, 
  Music, 
  Volume2, 
  UserCheck, 
  X, 
  Sparkles, 
  FileAudio,
  CheckCircle2,
  Disc
} from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: ContraGameEngine;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  engine,
}) => {
  const [activeTab, setActiveTab] = useState<'boss' | 'music'>('boss');
  
  // Custom Boss State
  const [bossImage, setBossImage] = useState<string>(
    engine.customBossConfig?.imageUrl || ''
  );
  const [bossName, setBossName] = useState<string>(
    engine.customBossConfig?.name || 'TRÙM ĐẠI CA'
  );
  const [bossTitle, setBossTitle] = useState<string>(
    engine.customBossConfig?.title || 'Chúa Tể Không Gian'
  );
  const [bossApplied, setBossApplied] = useState<boolean>(
    Boolean(engine.customBossConfig)
  );

  // Music State
  const [currentMood, setCurrentMood] = useState<MusicMood>(audio.getMood());
  const [customAudioName, setCustomAudioName] = useState<string>('');

  const bossFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBossImage(engine.customBossConfig?.imageUrl || '');
      setBossName(engine.customBossConfig?.name || 'TRÙM ĐẠI CA');
      setBossTitle(engine.customBossConfig?.title || 'Chúa Tể Không Gian');
      setBossApplied(Boolean(engine.customBossConfig));
      setCurrentMood(audio.getMood());
    }
  }, [isOpen, engine]);

  if (!isOpen) return null;

  // Handle Boss Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setBossImage(result);
        setBossApplied(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyBoss = () => {
    if (!bossImage) return;
    const config: BossFaceConfig = {
      imageUrl: bossImage,
      name: bossName.trim() || 'TRÙM ĐẠI CA',
      title: bossTitle.trim() || 'Chúa Tể Không Gian',
    };
    engine.setCustomBoss(config);
    setBossApplied(true);
    audio.playPowerUp();
  };

  const handleResetBoss = () => {
    engine.clearCustomBoss();
    setBossImage('');
    setBossName('TRÙM ĐẠI CA');
    setBossTitle('Chúa Tể Không Gian');
    setBossApplied(false);
  };

  // Handle Music Mood Change
  const handleSelectMood = (mood: MusicMood) => {
    setCurrentMood(mood);
    audio.setMood(mood);
    audio.playPowerUp();
  };

  // Handle Custom Audio File Upload
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAudioName(file.name);
      audio.setCustomMusic(file);
      setCurrentMood('custom');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-arcade text-white">
        {/* Header */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase">CÀI ĐẶT TRÙM & ÂM NHẠC THEO TÂM TRẠNG</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('boss')}
            className={`px-4 py-2 rounded-t-lg border-t border-x transition-colors flex items-center gap-2 ${
              activeTab === 'boss'
                ? 'bg-zinc-900 border-red-500/80 text-red-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>ĐỔI MẶT TRÙM CUỐI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2 rounded-t-lg border-t border-x transition-colors flex items-center gap-2 ${
              activeTab === 'music'
                ? 'bg-zinc-900 border-sky-500/80 text-sky-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>NHẠC TÂM TRẠNG (BGM)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-zinc-300">
          {activeTab === 'boss' && (
            <div className="space-y-4">
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Tải ảnh chân dung của chính bạn, người quen hoặc bất kỳ ai để gắn vào 
                <span className="text-red-400 font-bold"> Trùm Cuối (Boss Core)</span> của các màn chơi! Hình ảnh sẽ được viền giáp cơ khí và chiếu laser bảo vệ.
              </p>

              {/* Boss Preview & Upload Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                {/* Cybernetic Boss Core Preview Frame */}
                <div className="flex flex-col items-center justify-center p-3 border border-zinc-800 rounded bg-zinc-900/60">
                  <span className="text-[10px] text-zinc-400 mb-2 uppercase">Mô phỏng trong game</span>
                  <div className="relative w-24 h-24 rounded-full border-4 border-sky-500 flex items-center justify-center bg-slate-900 shadow-lg shadow-sky-500/30 overflow-hidden">
                    {bossImage ? (
                      <img
                        src={bossImage}
                        alt="Boss Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-red-600 animate-pulse flex items-center justify-center text-[10px] text-white font-bold">
                        GỐC
                      </div>
                    )}
                    {/* Targeting reticle crosshair overlay */}
                    <div className="absolute inset-0 pointer-events-none border border-sky-400/40 rounded-full" />
                    <div className="absolute w-full h-[1px] bg-sky-400/30 pointer-events-none" />
                    <div className="absolute h-full w-[1px] bg-sky-400/30 pointer-events-none" />
                  </div>

                  {/* Boss Name tag preview */}
                  <div className="mt-2 bg-black border border-amber-500/80 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                    {bossName || 'TRÙM ĐẠI CA'}
                  </div>
                </div>

                {/* Upload & Naming Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                      Tên hiển thị của Trùm:
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={bossName}
                      onChange={e => {
                        setBossName(e.target.value);
                        setBossApplied(false);
                      }}
                      placeholder="VD: TRÙM ĐẠI CA"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">
                      Danh hiệu Trùm:
                    </label>
                    <input
                      type="text"
                      maxLength={25}
                      value={bossTitle}
                      onChange={e => {
                        setBossTitle(e.target.value);
                        setBossApplied(false);
                      }}
                      placeholder="VD: Chúa Tể Thung Lũng"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* File Upload Button */}
                  <input
                    ref={bossFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => bossFileInputRef.current?.click()}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded px-3 py-1.5 text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>{bossImage ? 'Chọn ảnh khác' : 'Tải ảnh mặt lên'}</span>
                    </button>

                    {bossImage && (
                      <button
                        type="button"
                        onClick={handleResetBoss}
                        title="Xóa ảnh và dùng trùm mặc định"
                        className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded px-2 py-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  {bossApplied && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã kích hoạt mặt trùm vào trận chiến!</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleApplyBoss}
                  disabled={!bossImage}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-5 py-2 rounded text-xs font-bold transition-colors shadow-md shadow-red-600/40"
                >
                  ÁP DỤNG MẶT TRÙM
                </button>
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-4">
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Tùy chỉnh giai điệu chiptune Retro 8-bit theo tâm trạng chiến đấu của bạn, hoặc tải lên file nhạc bài hát riêng (MP3/WAV)!
              </p>

              {/* Mood Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'epic',
                    name: 'HÙNG TRÁNG (EPIC NES)',
                    desc: 'Âm hưởng Contra cổ điển 1987, tiết tấu dồn dập, guitar chiptune rực lửa.',
                    color: 'border-red-500/80 bg-red-950/40 text-red-300',
                  },
                  {
                    id: 'boss_rush',
                    name: 'BOSS RUSH TỐC ĐỘ CAO',
                    desc: 'Nhịp bassline 155 BPM siêu nhanh, hồi hộp nghẹt thở đấu trùm.',
                    color: 'border-amber-500/80 bg-amber-950/40 text-amber-300',
                  },
                  {
                    id: 'jungle_mystic',
                    name: 'RỪNG SÂU HUYỀN BÍ',
                    desc: 'Tiếng sáo mộc và giai điệu khám phá Tây Nguyên & Sơn Đoòng.',
                    color: 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300',
                  },
                  {
                    id: 'chill',
                    name: 'THƯ THÁI / NGHỈ NGƠI',
                    desc: 'Giai điệu lướt êm ả, thư giãn ngắm biển Vịnh Hạ Long.',
                    color: 'border-sky-500/80 bg-sky-950/40 text-sky-300',
                  },
                ].map(m => {
                  const isSelected = currentMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMood(m.id as MusicMood)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? `${m.color} ring-2 ring-white/30 shadow-md`
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{m.name}</span>
                        {isSelected && <Disc className="w-4 h-4 animate-spin text-white" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Audio File Upload */}
              <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <FileAudio className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase">Tải nhạc nền riêng (MP3 / WAV / OGG)</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Bạn có thể chọn bất kỳ bài hát nào từ máy để làm nhạc nền chiến đấu trong suốt các màn!
                </p>

                <input
                  ref={musicFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleCustomAudioUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => musicFileInputRef.current?.click()}
                    className="bg-purple-900/60 hover:bg-purple-900 border border-purple-500 text-purple-200 px-4 py-1.5 rounded text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn file nhạc MP3</span>
                  </button>

                  {customAudioName && (
                    <span className="text-[10px] text-zinc-300 truncate max-w-[200px]">
                      {customAudioName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-zinc-800 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-1.5 rounded text-xs transition-colors"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
