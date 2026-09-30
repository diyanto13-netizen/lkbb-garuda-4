import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, X, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck, Clock } from 'lucide-react';
import { verifyPin } from '../utils/security';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  currentPin: string;
  targetMenuTitle?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  targetMenuTitle = 'Menu Khusus Panitia'
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Timer countdown untuk lockout anti brute-force
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setError('');
    setLoading(true);

    try {
      const isValid = await verifyPin(pin, currentPin);

      if (isValid) {
        const dummyToken = 'adm_sess_' + Math.random().toString(36).substring(2) + Date.now();
        onSuccess(dummyToken);
        setPin('');
        setError('');
        setFailedAttempts(0);
        onClose();
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutRemaining(30);
          setError('Terlalu banyak percobaan PIN yang salah. Akses dikunci selama 30 detik untuk keamanan.');
        } else {
          setError(`PIN Keamanan salah! Akses ditolak. Sisa percobaan: ${5 - nextAttempts}x.`);
        }
      }
    } catch {
      setError('Terjadi kendala validasi keamanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Akses Khusus Panitia</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Autentikasi Panitia
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Membuka akses: <span className="text-amber-300 font-bold">{targetMenuTitle}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Akses Terbatas Panitia</span>
          </div>
          Halaman ini khusus diperuntukkan bagi panitia resmi LKBB GARUDA IV. Silakan masukkan PIN otorisasi Anda.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Masukkan PIN Panitia
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                disabled={lockoutRemaining > 0}
                onChange={(e) => setPin(e.target.value)}
                placeholder={lockoutRemaining > 0 ? `Terkunci (${lockoutRemaining}s)...` : "Ketik PIN Panitia..."}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 disabled:opacity-50 disabled:bg-slate-900 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pr-12 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {lockoutRemaining > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-xs text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                <span>Percobaan dikunci sementara. Silakan tunggu <b>{lockoutRemaining} detik</b>.</span>
              </div>
            )}

            {error && lockoutRemaining === 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !pin.trim() || lockoutRemaining > 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {loading ? (
                <span>Memverifikasi PIN...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buka Akses Menu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
