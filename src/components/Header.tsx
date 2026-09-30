import React from 'react';
import { 
  Trophy, 
  UserPlus, 
  Search, 
  Dices, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  FileCode,
  School
} from 'lucide-react';
import { AdminSession } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  adminSession: AdminSession;
  onOpenPinModal: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  adminSession,
  onOpenPinModal,
  onLogoutAdmin
}) => {
  return (
    <header className="no-print bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md shadow-2xl">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-amber-500/20 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300/90">
            <School className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">PENYELENGGARA:</span> SMKS PGRI 1 KOTA SUKABUMI · PASKIBRA GARUDA IV
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span>Tingkat SD/MI · SMP/MTs · SMA/SMK/MA</span>
            <span className="text-amber-500/60 font-bold">SE-JAWA BARAT</span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Emblem */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/40 group-hover:scale-105 transition-all">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black tracking-widest rounded uppercase shadow">
              IV
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                LKBB GARUDA IV
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                RESMI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Sistem Registrasi & Manajemen Peleton · SMKS PGRI 1 Sukabumi
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Dashboard Kuota</span>
          </button>

          <button
            onClick={() => onSelectTab('register')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'register'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Daftar Peleton</span>
          </button>

          <button
            onClick={() => onSelectTab('tracking')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'tracking'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lacak & E-Ticket</span>
          </button>

          {/* Protected Tabs: Lucky Wheel, ID Card, GAS Code */}
          <button
            onClick={() => onSelectTab('wheel')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'wheel'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Dices className="w-3.5 h-3.5 text-sky-400" />
            <span>Lucky Wheel TM</span>
            {!adminSession.isAuthenticated && (
              <Lock className="w-3 h-3 text-amber-400/80 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('idcards')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'idcards'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ID Card Peserta</span>
            {!adminSession.isAuthenticated && (
              <Lock className="w-3 h-3 text-amber-400/80 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('gas-code')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'gas-code'
                ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>GAS Code</span>
            {!adminSession.isAuthenticated && (
              <Lock className="w-3 h-3 text-amber-400/80 ml-0.5" />
            )}
          </button>

          {/* Admin Lock / Unlock Button */}
          {adminSession.isAuthenticated ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel Panitia</span>
              </button>
              <button
                onClick={onLogoutAdmin}
                title="Kunci / Keluar Sesi Panitia"
                className="px-2 py-2 text-xs rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('admin')}
              className="ml-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Panel Panitia</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
