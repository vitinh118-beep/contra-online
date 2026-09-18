import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Wifi, 
  Globe, 
  Users, 
  Copy, 
  Check, 
  Play, 
  Send, 
  Smartphone, 
  Laptop, 
  Radio, 
  Activity, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  Info,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { network } from '../game/network';
import { ContraGameEngine } from '../game/engine';
import { audio } from '../game/audio';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: ContraGameEngine;
  onStartMultiplayerGame: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  engine,
  onStartMultiplayerGame,
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'lan_guide' | 'internet_guide' | 'tech_architecture'>('lobby');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(network.roomCode);
  const [role, setRole] = useState<'host' | 'guest' | null>(network.role);
  const [guestConnected, setGuestConnected] = useState<boolean>(false);
  const [peerName, setPeerName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [ping, setPing] = useState<number>(network.pingMs);
  const [wsConnected, setWsConnected] = useState<boolean>(network.isConnected);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: number }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lanInfo, setLanInfo] = useState<{ lanIps: string[]; suggestedLanUrl: string } | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Fetch LAN IP information from backend
  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-info')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok') {
            setLanInfo({
              lanIps: data.lanIps || [],
              suggestedLanUrl: data.suggestedLanUrl || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Network client event hooks
  useEffect(() => {
    network.connect();

    network.onConnectionChange = (connected) => {
      setWsConnected(connected);
    };

    network.onPingUpdate = (ms) => {
      setPing(ms);
    };

    network.onRoomCreated = (code) => {
      setCurrentRoomCode(code);
      setRole('host');
      setErrorMessage(null);
      audio.playPowerUp();
    };

    network.onRoomJoined = (code, hostName) => {
      setCurrentRoomCode(code);
      setRole('guest');
      setPeerName(hostName || 'BILL (Host)');
      setGuestConnected(true);
      setErrorMessage(null);
      audio.playPowerUp();
    };

    network.onPeerJoined = (name) => {
      setGuestConnected(true);
      setPeerName(name);
      audio.play1Up();
    };

    network.onPeerLeft = (msg) => {
      setGuestConnected(false);
      setErrorMessage(msg);
      audio.playPlayerHit();
    };

    network.onChatMessage = (sender, text) => {
      setChatMessages(prev => [...prev.slice(-8), { sender, text, time: Date.now() }]);
      audio.playShoot('M');
    };

    network.onError = (msg) => {
      setErrorMessage(msg);
      audio.playPlayerHit();
    };

    // Auto-check URL for ?room=XXXX parameter
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && !currentRoomCode) {
      setRoomCodeInput(roomFromUrl.toUpperCase());
    }

    return () => {
      // Keep callbacks active
    };
  }, [currentRoomCode]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    engine.isNetworkHost = true;
    engine.isNetworkGuest = false;
    engine.networkPlayerId = 1;
    await network.createRoom('BILL (Host)');
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Vui lòng nhập mã phòng gồm 4 chữ số hoặc chữ cái!');
      return;
    }
    setErrorMessage(null);
    engine.isNetworkHost = false;
    engine.isNetworkGuest = true;
    engine.networkPlayerId = 2;
    await network.joinRoom(code, 'LANCE (Khách)');
  };

  // Handle Start Battle
  const handleStartBattle = () => {
    if (role === 'host') {
      setIsStarting(true);
      engine.isNetworkHost = true;
      engine.isNetworkGuest = false;
      engine.networkPlayerId = 1;

      // Broadcast start to guest
      network.startGame({
        initialLives: 3,
        difficulty: engine.difficulty,
        stageIndex: 0,
      });

      // Start host engine
      engine.start('2P', 3, engine.difficulty, 0);
      audio.startBGM('stage');

      setTimeout(() => {
        setIsStarting(false);
        onStartMultiplayerGame();
        onClose();
      }, 500);
    }
  };

  // Copy Room Link
  const handleCopyInviteLink = () => {
    if (!currentRoomCode) return;
    const url = `${window.location.origin}/?room=${currentRoomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send Quick Taunt
  const handleSendTaunt = (text: string) => {
    network.sendChatMessage(text);
    setChatMessages(prev => [...prev.slice(-8), { sender: role === 'host' ? 'BILL (Bạn)' : 'LANCE (Bạn)', text, time: Date.now() }]);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    network.leaveRoom();
    setCurrentRoomCode(null);
    setRole(null);
    setGuestConnected(false);
    setPeerName('');
    engine.isNetworkHost = false;
    engine.isNetworkGuest = false;
    engine.networkPlayerId = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-950 border-2 border-red-600 rounded-xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 bg-red-600 rounded text-white font-arcade text-xs flex items-center justify-center shadow-lg shadow-red-600/40">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-arcade text-xs sm:text-sm text-red-500 tracking-wider">
                CHƠI 2 NGƯỜI QUA MẠNG (LAN & INTERNET)
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                  {wsConnected ? 'WebSocket Sẵn Sàng' : 'Đang kết nối Server...'}
                </span>
                {wsConnected && (
                  <span>
                    • Ping: <strong className={ping < 50 ? 'text-emerald-400' : ping < 120 ? 'text-amber-400' : 'text-red-400'}>{ping}ms</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto text-[11px] font-arcade">
          <button
            type="button"
            onClick={() => setActiveTab('lobby')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'lobby'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SẢNH CHỜ PHÒNG</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lan_guide')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'lan_guide'
                ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>HƯỚNG DẪN MẠNG LAN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('internet_guide')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'internet_guide'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>HƯỚNG DẪN QUA INTERNET</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech_architecture')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'tech_architecture'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>CƠ CHẾ ĐỒNG BỘ 60 FPS</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SẢNH CHỜ PHÒNG CHƠI (LOBBY) */}
          {activeTab === 'lobby' && (
            <div className="space-y-4">
              {/* Error / Alert notification banner */}
              {errorMessage && (
                <div className="p-3 bg-red-950/70 border border-red-600/70 rounded-lg text-red-300 text-xs flex items-center gap-2 animate-shake">
                  <Info className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Case 1: Has not created or joined a room yet */}
              {!currentRoomCode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Create Room (Host) */}
                  <div className="p-4 bg-zinc-900/80 border border-zinc-700/80 rounded-xl space-y-3 hover:border-red-500/80 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-red-400 font-arcade text-xs">
                        <Radio className="w-4 h-4" />
                        <span>MÁY 1: TẠO PHÒNG MỚI (CHỦ PHÒNG)</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                        Bạn sẽ là <strong>Player 1 (BILL - Áo Xanh)</strong>. Hệ thống sẽ cấp một mã phòng 4 ký tự để bạn gửi cho bạn bè cùng kết nối vào.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      className="w-full mt-4 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-arcade text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>TẠO PHÒNG & LẤY MÃ</span>
                    </button>
                  </div>

                  {/* Option B: Join Room (Guest) */}
                  <div className="p-4 bg-zinc-900/80 border border-zinc-700/80 rounded-xl space-y-3 hover:border-sky-500/80 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sky-400 font-arcade text-xs">
                        <Users className="w-4 h-4" />
                        <span>MÁY 2: NHẬP MÃ ĐỂ VÀO PHÒNG</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                        Bạn sẽ là <strong>Player 2 (LANCE - Áo Đỏ)</strong>. Nhập mã phòng 4 ký tự do bạn bè của bạn chia sẻ để vào trận chung:
                      </p>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="MÃ PHÒNG (VD: 8821)"
                          value={roomCodeInput}
                          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                          className="flex-1 bg-black border border-zinc-700 focus:border-sky-500 rounded-lg px-3 py-2 text-white font-arcade text-xs tracking-wider outline-none text-center uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleJoinRoom}
                          className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-arcade text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>VÀO</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 2: Currently inside a room */
                <div className="space-y-4">
                  {/* Room Active Card */}
                  <div className="p-4 bg-gradient-to-r from-red-950/40 via-zinc-900 to-sky-950/40 border border-red-600/70 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-600/20 border border-red-500 rounded-lg flex items-center justify-center font-arcade text-xl text-red-400">
                        {currentRoomCode}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-arcade">PHÒNG HIỆN TẠI:</span>
                          <span className="text-lg font-arcade font-bold text-amber-400">{currentRoomCode}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            {role === 'host' ? 'BẠN LÀ CHỦ PHÒNG' : 'BẠN LÀ KHÁCH'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {guestConnected 
                            ? '✅ Cả 2 người chơi đã kết nối thành công! Sẵn sàng chiến đấu!' 
                            : '⏳ Đang chờ người chơi 2 nhập mã hoặc mở link...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-arcade flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'ĐÃ COPY LINK' : 'COPY LINK GỬI BẠN BÈ'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLeaveRoom}
                        title="Rời khỏi phòng"
                        className="p-2 bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2 Player Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Player 1 Card (Bill - Blue) */}
                    <div className="p-3.5 bg-zinc-900/90 border-2 border-blue-500/80 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400 flex items-center justify-center font-arcade text-xs text-blue-400 font-bold">
                        P1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-arcade text-xs text-blue-400">BILL RIZER</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            {role === 'host' ? 'BẠN' : 'CHỦ PHÒNG'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã sẵn sàng • Vũ khí: Rifle (Súng R)</span>
                        </div>
                      </div>
                    </div>

                    {/* Player 2 Card (Lance - Red) */}
                    <div className={`p-3.5 bg-zinc-900/90 border-2 rounded-xl flex items-center gap-3 transition-colors ${
                      guestConnected ? 'border-red-500/80' : 'border-zinc-800'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-arcade text-xs font-bold ${
                        guestConnected 
                          ? 'bg-red-600/30 border border-red-400 text-red-400' 
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                      }`}>
                        P2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-arcade text-xs ${guestConnected ? 'text-red-400' : 'text-zinc-500'}`}>
                            LANCE BEAN
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {guestConnected ? (role === 'guest' ? 'BẠN' : peerName || 'KHÁCH') : 'ĐANG CHỜ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                          {guestConnected ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Đã vào phòng • Sẵn sàng!</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                              <span className="text-amber-400">Chờ người thứ 2 nhập mã...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Start Battle Action */}
                  <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-zinc-300">
                      {role === 'host' ? (
                        <span>Chủ phòng có quyền ấn <strong>BẮT ĐẦU TRẬN CHIẾN</strong> khi cả 2 đã sẵn sàng.</span>
                      ) : (
                        <span>Đang đợi chủ phòng bấm bắt đầu trận chiến... Hãy chuẩn bị phím bấm!</span>
                      )}
                    </div>

                    {role === 'host' && (
                      <button
                        type="button"
                        onClick={handleStartBattle}
                        disabled={isStarting}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-arcade text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          guestConnected
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 animate-pulse'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{isStarting ? 'ĐANG VÀO TRẬN...' : (guestConnected ? 'CHIẾN ĐẤU NGAY (2 NGƯỜI)' : 'CHƠI 1 MÌNH TRƯỚC')}</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Voice / Taunt Chats */}
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-arcade text-zinc-400">LỆNH THOẠI / CHAT NHANH VỚI ĐỒNG ĐỘI:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Cẩn thận sau lưng!',
                        'Nhặt đạn S (Spread) đi!',
                        'Lặn xuống nước né đạn!',
                        'Cứu tớ với!',
                        'Bắn Trùm Cuối mau!',
                        'Bảo vệ tớ với!'
                      ].map((txt) => (
                        <button
                          key={txt}
                          type="button"
                          onClick={() => handleSendTaunt(txt)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-arcade transition-colors"
                        >
                          💬 {txt}
                        </button>
                      ))}
                    </div>

                    {/* Chat Log */}
                    {chatMessages.length > 0 && (
                      <div className="mt-2 p-2 bg-black/60 rounded border border-zinc-800 max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                        {chatMessages.map((c, i) => (
                          <div key={i} className="text-zinc-300">
                            <span className="text-amber-400 font-bold font-arcade text-[10px]">{c.sender}:</span> {c.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HƯỚNG DẪN MẠNG LAN (WI-FI CÙNG PHÒNG) */}
          {activeTab === 'lan_guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
              <div className="p-3.5 bg-sky-950/40 border border-sky-500/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-arcade text-xs text-sky-400">
                  <Wifi className="w-4 h-4" />
                  <span>CÁCH CHƠI 2 NGƯỜI TRONG CÙNG MẠNG LAN / WI-FI NHÀ BẠN</span>
                </div>
                <p>
                  Mạng LAN cho độ trễ siêu thấp <strong>(Ping &lt; 5ms)</strong>, đạn và nhân vật di chuyển tức thì như chơi trên cùng 1 máy NES thật.
                </p>
              </div>

              <ol className="space-y-3 list-decimal list-inside bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                <li className="font-semibold text-white">
                  <span className="text-amber-400 font-arcade">BƯỚC 1:</span> Kết nối 2 thiết bị vào chung 1 cục Wi-Fi
                  <p className="font-normal text-zinc-400 ml-5 mt-1">
                    Cả 2 người chơi (có thể là 2 máy tính, hoặc 1 máy tính + 1 điện thoại) phải cùng bắt vào chung mạng Wi-Fi hoặc cắm chung mạng LAN nội bộ.
                  </p>
                </li>

                <li className="font-semibold text-white">
                  <span className="text-amber-400 font-arcade">BƯỚC 2:</span> Xem địa chỉ IP của Máy Chủ (Host)
                  <p className="font-normal text-zinc-400 ml-5 mt-1">
                    Trên máy chủ, địa chỉ IP mạng nội bộ thường có dạng <code>192.168.1.xxx:3000</code>.
                  </p>
                  {lanInfo && lanInfo.lanIps.length > 0 && (
                    <div className="mt-2 ml-5 p-2 bg-black/80 rounded border border-zinc-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-emerald-400 text-xs">
                        <Laptop className="w-4 h-4" />
                        <span>Địa chỉ LAN gợi ý: <strong>{lanInfo.suggestedLanUrl}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(lanInfo.suggestedLanUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-arcade flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'ĐÃ COPY' : 'COPY IP'}</span>
                      </button>
                    </div>
                  )}
                </li>

                <li className="font-semibold text-white">
                  <span className="text-amber-400 font-arcade">BƯỚC 3:</span> Máy 2 mở trình duyệt và gõ địa chỉ IP
                  <p className="font-normal text-zinc-400 ml-5 mt-1">
                    Người thứ 2 mở Chrome/Safari trên điện thoại hoặc máy tính, gõ địa chỉ IP ở Bước 2.
                  </p>
                </li>

                <li className="font-semibold text-white">
                  <span className="text-amber-400 font-arcade">BƯỚC 4:</span> Máy 1 Tạo phòng &rarr; Máy 2 Nhập mã
                  <p className="font-normal text-zinc-400 ml-5 mt-1">
                    Máy 1 bấm <strong>"Tạo phòng mới"</strong> nhận mã (ví dụ <code>8821</code>). Máy 2 nhập mã đó vào là 2 máy kết nối thẳng và chiến đấu ngay!
                  </p>
                </li>
              </ol>
            </div>
          )}

          {/* TAB 3: HƯỚNG DẪN QUA INTERNET */}
          {activeTab === 'internet_guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-arcade text-xs text-emerald-400">
                  <Globe className="w-4 h-4" />
                  <span>CHƠI QUA INTERNET (DỄ NHẤT - 1 CÚ CLICK)</span>
                </div>
                <p>
                  Game chạy trực tiếp trên nền tảng Cloud. Bạn không cần cấu hình mạng hay mở cổng modem (Port Forwarding), bất kỳ ai có link đều vào chơi được ngay.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-600/20 text-emerald-400 font-arcade flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-arcade text-xs text-white">TẠO PHÒNG TRÊN WEB</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Bạn chỉ cần ấn nút <strong>"Tạo phòng mới"</strong> ở Tab Sảnh Chờ. Một mã phòng 4 ký tự sẽ được tạo tự động trên máy chủ.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-600/20 text-emerald-400 font-arcade flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-arcade text-xs text-white">COPY LINK GỬI BẠN BÈ</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Bấm <strong>"Copy link gửi bạn bè"</strong> rồi dán vào tin nhắn Zalo, Messenger, Facebook hoặc Discord. Link có chứa sẵn mã phòng.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded bg-emerald-600/20 text-emerald-400 font-arcade flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-arcade text-xs text-white">BẤM VÀO LÀ VÀO PHÒNG</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Người thứ 2 chỉ cần bấm vào đường link bạn gửi, trình duyệt sẽ tự động kết nối và gia nhập phòng của bạn ngay lập tức!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                💡 <strong>Mẹo hay:</strong> Người thứ 2 có thể chơi bằng điện thoại (sử dụng phím cảm ứng ảo D-pad trên màn hình) trong khi bạn chơi bằng bàn phím trên máy tính!
              </div>
            </div>
          )}

          {/* TAB 4: SƠ ĐỒ KIẾN TRÚC & KỸ THUẬT */}
          {activeTab === 'tech_architecture' && (
            <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
              <div className="p-3.5 bg-amber-950/40 border border-amber-500/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-arcade text-xs text-amber-400">
                  <Activity className="w-4 h-4" />
                  <span>SƠ ĐỒ ĐỒNG BỘ 60 FPS (HOST-AUTHORITATIVE ARCHITECTURE)</span>
                </div>
                <p>
                  Contra là game hành động bắn súng góc nhìn ngang tốc độ cao. Dưới đây là cách hệ thống xử lý đồng bộ thời gian thực để không bao giờ bị lệch vị trí quái hoặc đạn:
                </p>
              </div>

              <div className="bg-black/80 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] space-y-3">
                <div className="text-amber-400 font-bold font-arcade text-xs">LUỒNG DỮ LIỆU THỜI GIAN THỰC:</div>
                <div className="p-3 bg-zinc-900 rounded border border-zinc-800 leading-6 text-zinc-300">
                  <div>1. <strong>Player 2 (Khách)</strong> nhấn phím &rarr; Gửi gói tin <code>PLAYER_INPUT</code> (left, right, jump, shoot) siêu nhẹ (~20 bytes) qua WebSocket.</div>
                  <div>2. <strong>Player 1 (Chủ phòng / Host)</strong> nhận input của P2 và tính toán vật lý Contra 60 FPS (va chạm, máu quái, đạn bay, camera).</div>
                  <div>3. <strong>Host</strong> đóng gói <code>STATE_SYNC</code> (vị trí P1, P2, quái, đạn, Boss) gửi ngược lại P2 với tần số 30–60 FPS.</div>
                  <div>4. <strong>Guest</strong> vẽ trực tiếp snapshot lên màn hình Canvas và phát âm thanh tương ứng.</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-zinc-900/90 rounded border border-zinc-700">
                    <span className="text-emerald-400 font-bold font-arcade text-[10px]">TẠI SAO KHÔNG BỊ DESYNC?</span>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      Vì chỉ có duy nhất 1 máy chủ (Host) quyết định quái sinh ra ở đâu và trúng đạn hay chưa. Khách luôn thấy đúng 100% như Host.
                    </p>
                  </div>

                  <div className="p-2.5 bg-zinc-900/90 rounded border border-zinc-700">
                    <span className="text-sky-400 font-bold font-arcade text-[10px]">ĐỘ TRỄ & BĂNG THÔNG</span>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      Gói tin snapshot được nén tọa độ số nguyên (Integer rounding), tốn chưa tới 15 KB/giây, hoạt động mượt cả trên 4G di động.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <footer className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between shrink-0 text-xs font-arcade">
          <span className="text-zinc-500 text-[10px]">
            CONTRA ARCADE NETPLAY • VERSION 2.0 MULTIPLAYER
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
          >
            ĐÓNG
          </button>
        </footer>
      </div>
    </div>
  );
};
