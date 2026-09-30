import React, { useState, useEffect, useRef } from 'react';
import { 
  Dices, 
  RotateCw, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Building, 
  Trophy, 
  FileText,
  Volume2,
  X,
  Maximize2,
  Minimize2,
  Tv,
  Radio
} from 'lucide-react';
import { Pendaftaran, Jenjang } from '../types';
import { playTickSound, playFanfareSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface LuckyWheelProps {
  registrations: Pendaftaran[];
  onSaveNomorTampil: (regId: string, nomorTampil: number) => void;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  registrations,
  onSaveNomorTampil
}) => {
  const [selectedJenjang, setSelectedJenjang] = useState<Jenjang>('SMA/SMK/MA');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winnerNumber, setWinnerNumber] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [showBeritaAcara, setShowBeritaAcara] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Teams in the chosen jenjang that are verified
  const verifiedTeams = registrations.filter(
    (r) => r.jenjang === selectedJenjang && (r.status === 'Terverifikasi' || r.status === 'Menunggu Verifikasi')
  );

  // Teams that do not yet have a performance number assigned
  const undrawnTeams = verifiedTeams.filter((r) => r.noTampil === null || r.noTampil === undefined);

  // Already assigned numbers in this jenjang
  const assignedNumbers = verifiedTeams
    .map((r) => r.noTampil)
    .filter((n): n is number => n !== null && n !== undefined);

  // Total slots available based on total quota or team count
  const totalSlots = Math.max(12, verifiedTeams.length + 3);
  
  // Available numbers to spin (numbers that are NOT yet assigned!)
  const availableNumbers: number[] = [];
  for (let i = 1; i <= totalSlots; i++) {
    if (!assignedNumbers.includes(i)) {
      availableNumbers.push(i);
    }
  }

  // Auto-select first undrawn team if not selected
  useEffect(() => {
    if (undrawnTeams.length > 0 && (!selectedTeamId || !undrawnTeams.some(t => t.id === selectedTeamId))) {
      setSelectedTeamId(undrawnTeams[0].id);
    } else if (undrawnTeams.length === 0) {
      setSelectedTeamId('');
    }
  }, [selectedJenjang, registrations, undrawnTeams, selectedTeamId]);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen?.();
        }
      } catch {
        // Fallback automatically via CSS fixed inset-0 overlay
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen?.();
        }
      } catch {
        // Ignore
      }
    }
  };

  // Keyboard shortcut (ESC to exit fullscreen, Spacebar to spin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.code === 'Space' && !isSpinning) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea') {
          e.preventDefault();
          if (availableNumbers.length > 0 && selectedTeamId) {
            handleSpin();
          }
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, isSpinning, availableNumbers.length, selectedTeamId]);

  // Draw wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 18;

    ctx.clearRect(0, 0, width, height);

    const numSegments = availableNumbers.length;
    if (numSegments === 0) {
      // Empty state on wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Semua Nomor Telah Terundi', centerX, centerY);
      return;
    }

    const arcSize = (2 * Math.PI) / numSegments;
    const colors = [
      '#0f172a', // Navy slate
      '#d97706', // Gold amber
      '#991b1b', // Crimson
      '#1e293b', // Deep slate
      '#b45309', // Dark amber
      '#7f1d1d'  // Dark crimson
    ];

    // Responsive font size based on radius & segment count
    const numberFontSize = Math.max(14, Math.min(22, Math.round((radius * 0.115) * (numSegments > 24 ? 0.78 : 1))));

    // Draw slices
    for (let i = 0; i < numSegments; i++) {
      const startAngle = angle + i * arcSize;
      const endAngle = startAngle + arcSize;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Draw number text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = i % 2 === 1 ? '#090e17' : '#ffffff';
      if (colors[i % colors.length] === '#d97706') ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${numberFontSize}px JetBrains Mono, monospace`;
      ctx.fillText(`${availableNumbers[i]}`, radius - 22, numberFontSize * 0.35);
      ctx.restore();

      // Outer rim pegs
      const pegAngle = startAngle;
      const pegX = centerX + (radius - 4) * Math.cos(pegAngle);
      const pegY = centerY + (radius - 4) * Math.sin(pegAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, Math.max(3, Math.round(radius * 0.016)), 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }

    // Outer ring border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = Math.max(6, Math.round(radius * 0.038));
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    // Center Hub
    const hubRadius = Math.max(38, Math.round(radius * 0.18));
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.lineWidth = Math.max(4, Math.round(radius * 0.02));
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = `900 ${Math.max(12, Math.round(hubRadius * 0.32))}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GARUDA', centerX, centerY - Math.round(hubRadius * 0.16));
    ctx.font = `bold ${Math.max(10, Math.round(hubRadius * 0.28))}px JetBrains Mono, monospace`;
    ctx.fillText('IV', centerX, centerY + Math.round(hubRadius * 0.22));
  };

  // Re-draw when available numbers, selectedJenjang, or isFullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      drawWheel(currentAngleRef.current);
    }, 40);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [availableNumbers.length, selectedJenjang, isFullscreen]);

  // Spin the wheel
  const handleSpin = () => {
    if (isSpinning || availableNumbers.length === 0 || !selectedTeamId) return;

    setIsSpinning(true);
    setWinnerNumber(null);

    // Pick random winner from available numbers
    const winnerIdx = Math.floor(Math.random() * availableNumbers.length);
    const chosenNumber = availableNumbers[winnerIdx];

    const numSegments = availableNumbers.length;
    const arcSize = (2 * Math.PI) / numSegments;

    // Pointer is at the TOP (angle = 3 * Math.PI / 2)
    // We want the winner segment center to end up at the top pointer!
    const targetSegmentCenter = winnerIdx * arcSize + arcSize / 2;
    const pointerAngle = (3 * Math.PI) / 2;

    const fullRotations = (6 + Math.floor(Math.random() * 4)) * (2 * Math.PI);
    const targetAngle = pointerAngle - targetSegmentCenter + fullRotations;

    const startAngle = currentAngleRef.current % (2 * Math.PI);
    const totalRotation = targetAngle - startAngle;
    const duration = 4800; // ms
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;
      currentAngleRef.current = currentAngle;

      drawWheel(currentAngle);

      // Sound tick on passing pegs
      if (Math.abs(currentAngle - lastTickAngle) >= arcSize * 0.75) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinnerNumber(chosenNumber);
        setShowWinnerModal(true);
        playFanfareSound();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleConfirmSave = () => {
    if (selectedTeamId && winnerNumber !== null) {
      onSaveNomorTampil(selectedTeamId, winnerNumber);
      setShowWinnerModal(false);
      // Auto select next team
      const remainingTeams = undrawnTeams.filter(t => t.id !== selectedTeamId);
      if (remainingTeams.length > 0) {
        setSelectedTeamId(remainingTeams[0].id);
      } else {
        setSelectedTeamId('');
      }
    }
  };

  const currentSelectedTeam = registrations.find(r => r.id === selectedTeamId);
  const canvasSize = isFullscreen ? 540 : 420;

  return (
    <div 
      ref={containerRef}
      className={
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto animate-in fade-in duration-200' 
          : 'space-y-8 max-w-6xl mx-auto'
      }
    >
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 no-print ${isFullscreen ? 'mb-4' : ''}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              TECHNICAL MEETING (TM) LKBB GARUDA IV
            </span>
            {isFullscreen && (
              <span className="px-2 py-0.5 rounded-full bg-red-950/90 border border-red-700/60 text-red-400 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                LAYAR PENUH TM
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Dices className="w-7 h-7 text-sky-400 shrink-0" />
            <span>Modul Pengundian Nomor Tampil (Lucky Wheel)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengundian transparan disaksikan bersama pada sesi TM. Nomor yang terundi otomatis tersimpan dan hilang dari bilah putar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Tampilkan Layar Penuh (Fullscreen) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
              isFullscreen
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow-slate-900/50'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
            }`}
            title={isFullscreen ? 'Keluar dari mode layar penuh (ESC)' : 'Tampilkan Lucky Wheel Layar Penuh untuk Proyektor / Layar TM'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span>Keluar Layar Penuh (ESC)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Layar Penuh TM (Fullscreen)</span>
              </>
            )}
          </button>

          {!isFullscreen && (
            <button
              type="button"
              onClick={() => setShowBeritaAcara(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Berita Acara TM</span>
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Spotlight Team Banner (Prominently displayed in Fullscreen) */}
      {isFullscreen && (
        <div className="no-print p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-2 border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-400 uppercase">
                <span>PELETON YANG SEDANG DIUNDI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {currentSelectedTeam ? currentSelectedTeam.namaSekolah : 'Seluruh Peleton Telah Selesai Diundi!'}
              </div>
              {currentSelectedTeam && (
                <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Peleton: <b className="text-amber-300 font-semibold">{currentSelectedTeam.namaPeleton}</b></span>
                  <span>•</span>
                  <span>Kota: <b>{currentSelectedTeam.kotaAsal}</b></span>
                  <span>•</span>
                  <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {currentSelectedTeam.noPeserta || 'PESERTA'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Sisa Antrean: </span>
              <b className="text-amber-400 font-bold">{undrawnTeams.length}</b>
              <span className="text-slate-500 text-[11px]"> / {verifiedTeams.length} Peleton</span>
            </div>
          </div>
        </div>
      )}

      {/* Jenjang Selector Tabs */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          {(['SD/MI', 'SMP/MTs', 'SMA/SMK/MA'] as Jenjang[]).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => {
                setSelectedJenjang(j);
                setWinnerNumber(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedJenjang === j
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tingkat {j}
            </button>
          ))}
        </div>

        {isFullscreen && (
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Audio & Konfeti Otomatis Aktif</span>
          </div>
        )}
      </div>

      {/* Main Wheel Stage */}
      <div className={`no-print grid grid-cols-1 ${isFullscreen ? 'xl:grid-cols-12 gap-8 items-start' : 'lg:grid-cols-12 gap-8 items-start'}`}>
        {/* Left Side: Canvas Lucky Wheel */}
        <div className={`${isFullscreen ? 'xl:col-span-7' : 'lg:col-span-7'} bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-2xl relative`}>
          {/* Wheel Pointer Pin at Top */}
          <div className="relative mb-2 z-20">
            <div className={`w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 filter drop-shadow-[0_4px_8px_rgba(234,179,8,0.7)] ${
              isFullscreen ? 'scale-125 -mb-1' : ''
            }`}></div>
          </div>

          {/* HTML5 Canvas */}
          <div className={`relative p-2 bg-slate-950 rounded-full border-4 border-slate-800 shadow-[0_0_60px_rgba(234,179,8,0.2)] transition-all ${
            isFullscreen ? 'shadow-[0_0_80px_rgba(234,179,8,0.3)]' : ''
          }`}>
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className="max-w-full h-auto cursor-pointer"
              onClick={handleSpin}
            />
          </div>

          {/* Action Trigger Button */}
          <div className={`mt-6 w-full ${isFullscreen ? 'max-w-md' : 'max-w-sm'}`}>
            <button
              type="button"
              disabled={isSpinning || availableNumbers.length === 0 || !selectedTeamId}
              onClick={handleSpin}
              className={`w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isFullscreen ? 'py-5 text-base sm:text-lg shadow-2xl' : 'py-4 text-sm'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Sedang Memutar Roda TM...' : 'Putar Lucky Wheel Sekarang'}</span>
            </button>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              {isFullscreen ? 'Bisa klik tombol di atas atau tekan tombol [Spasi] pada keyboard' : 'Klik tombol atau klik langsung pada roda untuk memutar'}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Dilengkapi efek suara putaran ratchet & konfeti selebrasi</span>
          </div>
        </div>

        {/* Right Side: Team Selection & Drawn Numbers Roster */}
        <div className={`${isFullscreen ? 'xl:col-span-5' : 'lg:col-span-5'} space-y-6`}>
          {/* Active Target Team Card (Normal mode only, Fullscreen has spotlight banner) */}
          {!isFullscreen && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  PELETON YANG DIUNDI
                </span>
                <span className="text-[11px] text-slate-400">
                  Sisa Undian: <b className="text-white">{undrawnTeams.length}</b> Satuan
                </span>
              </div>

              {undrawnTeams.length === 0 ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Seluruh Peleton Telah Terundi!</div>
                  <div className="text-[11px] text-slate-400">
                    Semua peserta tingkat {selectedJenjang} telah memiliki nomor urut tampil sah.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Pilih Peleton untuk Diundi:
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={isSpinning}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {undrawnTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.noPeserta ? `[${t.noPeserta}] ` : ''}{t.namaSekolah} ({t.namaPeleton})
                      </option>
                    ))}
                  </select>

                  {currentSelectedTeam && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-slate-400 text-[10px] font-mono">SEKOLAH PANGKALAN:</div>
                          <div className="font-bold text-white text-sm">{currentSelectedTeam.namaSekolah}</div>
                        </div>
                        <span className="text-amber-400 font-mono font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {currentSelectedTeam.noPeserta || 'PESERTA'}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Peleton: <b>{currentSelectedTeam.namaPeleton}</b> · Asal: <b>{currentSelectedTeam.kotaAsal}</b>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selector Peleton Saat Fullscreen */}
          {isFullscreen && undrawnTeams.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Ganti Pilihan Peleton yang Diundi:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSpinning}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {undrawnTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.noPeserta ? `[${t.noPeserta}] ` : ''}{t.namaSekolah} ({t.namaPeleton})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Real-time Order of Appearance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Daftar Urutan Tampil ({selectedJenjang})</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {assignedNumbers.length} / {verifiedTeams.length} Peleton Sah
              </span>
            </div>

            <div className={`overflow-y-auto border border-slate-800 rounded-xl ${isFullscreen ? 'max-h-[360px]' : 'max-h-64'}`}>
              {verifiedTeams.filter(t => t.noTampil !== null).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada nomor tampil yang diundi pada jenjang ini.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-center">No. Tampil</th>
                      <th className="px-3 py-2.5">Pangkalan Sekolah</th>
                      <th className="px-3 py-2.5">Peleton</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {verifiedTeams
                      .filter(t => t.noTampil !== null)
                      .sort((a, b) => (a.noTampil || 0) - (b.noTampil || 0))
                      .map((team) => (
                        <tr key={team.id} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 text-center font-mono font-black text-amber-400 text-base">
                            #{team.noTampil}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-white text-xs">{team.namaSekolah}</td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">{team.namaPeleton}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WINNER POPUP MODAL */}
      {showWinnerModal && winnerNumber !== null && currentSelectedTeam && (
        <div className="no-print fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl w-full max-w-lg p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-400 to-red-600"></div>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              HASIL PENGUNDIAN NOMOR TAMPIL SAH
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">{currentSelectedTeam.namaSekolah}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Peleton: <b className="text-amber-300">{currentSelectedTeam.namaPeleton}</b> ({currentSelectedTeam.kotaAsal})
            </p>

            <div className="my-6 p-6 sm:p-8 rounded-2xl bg-slate-950 border-2 border-amber-500/50 shadow-inner">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">NOMOR URUT TAMPIL RESMI</span>
              <div className="text-7xl sm:text-8xl font-black font-mono text-amber-400 tracking-tight mt-1 drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                {winnerNumber}
              </div>
              <span className="text-xs text-emerald-400 font-bold mt-2 block uppercase tracking-wider">
                TINGKAT {currentSelectedTeam.jenjang} · SAH DISAKSIKAN TM
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowWinnerModal(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Batal / Putar Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Nomor & Lanjut</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BERITA ACARA PRINT MODAL */}
      {showBeritaAcara && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-white print:backdrop-none print:overflow-visible">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl print:bg-white print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:p-0 print:m-0">
            {/* Modal Controls */}
            <div className="no-print bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <FileText className="w-4 h-4" />
                <span>LEMBAR BERITA ACARA PENGUNDIAN NOMOR TAMPIL</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen Resmi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBeritaAcara(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content (Printable A4) */}
            <div className="print-area p-10 bg-white text-slate-900 print:p-0 print:m-0 print:border-none print:shadow-none">
              {/* Kop Surat SMKS PGRI 1 Sukabumi */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="text-xs uppercase font-bold tracking-widest text-red-700">
                  YAYASAN PEMBINA LEMBAGA PENDIDIKAN DASAR DAN MENENGAH PERSATUAN GURU REPUBLIK INDONESIA
                </div>
                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  SMKS PGRI 1 KOTA SUKABUMI
                </h3>
                <div className="text-xs font-bold text-slate-800">
                  PANITIA PELAKSANA LKBB GARUDA IV TINGKAT SE-JAWA BARAT
                </div>
                <p className="text-[10px] text-slate-600">
                  Jl. Pelabuhan II Perum Cipoho Indah, Cikondang, Kec. Citamiang, Kota Sukabumi, Jawa Barat 43141 · Telp: (0266) 224277
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center my-6 space-y-1">
                <h4 className="text-base font-black underline uppercase text-slate-950">
                  BERITA ACARA PENGUNDIAN NOMOR URUT TAMPIL
                </h4>
                <div className="text-xs font-mono text-slate-600">
                  Nomor: 042/BA-TM/LKBB-G4/X/{new Date().getFullYear()}
                </div>
              </div>

              {/* Introductory Paragraph */}
              <div className="text-xs text-slate-800 leading-relaxed text-justify mb-4">
                Pada hari ini, bertempat di Gedung Serbaguna SMKS PGRI 1 Kota Sukabumi, telah dilaksanakan pengundian nomor urut tampil peleton peserta <b>LKBB GARUDA IV</b> secara terbuka, transparan, dan disaksikan oleh seluruh perwakilan Official dan Pelatih pada sesi <i>Technical Meeting</i>. Hasil pengundian untuk tingkat <b>{selectedJenjang}</b> adalah sebagai berikut:
              </div>

              {/* Table of Results */}
              <table className="w-full text-left text-xs border border-slate-900 mb-6 print:border-black">
                <thead className="bg-slate-100 font-bold border-b border-slate-900 print:bg-slate-50 print:border-black">
                  <tr>
                    <th className="px-3 py-2 border-r border-slate-900 print:border-black text-center w-16">No. Tampil</th>
                    <th className="px-3 py-2 border-r border-slate-900 print:border-black w-28">No. Peserta</th>
                    <th className="px-3 py-2 border-r border-slate-900 print:border-black">Pangkalan Sekolah</th>
                    <th className="px-3 py-2 border-r border-slate-900 print:border-black">Nama Peleton</th>
                    <th className="px-3 py-2 text-center w-28">Tanda Tangan Saksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400 print:divide-slate-300">
                  {verifiedTeams
                    .sort((a, b) => (a.noTampil || 999) - (b.noTampil || 999))
                    .map((item, idx) => (
                      <tr key={item.id} className="h-9">
                        <td className="px-3 py-1.5 border-r border-slate-900 print:border-black text-center font-mono font-bold text-sm">
                          {item.noTampil || '-'}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-900 print:border-black font-mono">
                          {item.noPeserta || '-'}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-900 print:border-black font-bold">
                          {item.namaSekolah}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-900 print:border-black text-slate-700">
                          {item.namaPeleton}
                        </td>
                        <td className="px-3 py-1.5 text-center text-[10px] text-slate-400 font-mono">
                          {idx + 1}. .........
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 text-center text-xs pt-6 border-t border-slate-300">
                <div>
                  <div className="text-[11px] text-slate-600 font-semibold">Perwakilan Saksi Peserta,</div>
                  <div className="h-16"></div>
                  <div className="font-bold underline text-slate-950">( ........................................ )</div>
                  <div className="text-[10px] text-slate-500">Official / Pelatih Pangkalan</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 font-semibold">Ketua Pelaksana LKBB Garuda IV,</div>
                  <div className="h-16"></div>
                  <div className="font-bold underline text-slate-950">Hilman Hidayat</div>
                  <div className="text-[10px] text-slate-500">Panitia Pelaksana</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
