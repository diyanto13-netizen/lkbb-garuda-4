/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuotaDashboard } from './components/QuotaDashboard';
import { RegistrationWizard } from './components/RegistrationWizard';
import { TrackingAndETicket } from './components/TrackingAndETicket';
import { LuckyWheel } from './components/LuckyWheel';
import { IdCardModule } from './components/IdCardModule';
import { AdminPanel } from './components/AdminPanel';
import { GasCodeViewer } from './components/GasCodeViewer';
import { PinModal } from './components/PinModal';
import { 
  INITIAL_KUOTA, 
  INITIAL_BANK, 
  INITIAL_SPONSORS, 
  INITIAL_PENDAFTARAN 
} from './data/initialData';
import { 
  Pendaftaran, 
  StatusPendaftaran, 
  BankConfig, 
  Sponsor, 
  AdminSession,
  KuotaJenjang 
} from './types';
import { CheckCircle2, Ticket, ArrowRight, X, Lock, KeyRound, ShieldAlert, CloudCheck, CloudOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  subscribeToRegistrations,
  subscribeToSettings,
  saveRegistrationToFirestore,
  deleteRegistrationFromFirestore,
  saveSettingsToFirestore,
  initializeDefaultSettingsIfEmpty
} from './services/firestoreService';
import { testFirestoreConnection } from './firebase';

const PROTECTED_TABS = ['wheel', 'idcards', 'gas-code', 'admin'];

interface AccessRestrictedCardProps {
  title: string;
  description: string;
  onUnlock: () => void;
}

const AccessRestrictedCard: React.FC<AccessRestrictedCardProps> = ({
  title,
  description,
  onUnlock
}) => {
  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl my-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-bold uppercase">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Akses Terproteksi Database PIN</span>
        </div>
        <h3 className="text-2xl font-black text-white">Menu {title} Dibatasi</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={onUnlock}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Lock className="w-4 h-4" />
          <span>Masukkan PIN Panitia untuk Membuka</span>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  // Persistence state
  const [quotas, setQuotas] = useState<KuotaJenjang[]>(() => {
    const saved = localStorage.getItem('lkbb4_quotas');
    return saved ? JSON.parse(saved) : INITIAL_KUOTA;
  });

  const [registrations, setRegistrations] = useState<Pendaftaran[]>(() => {
    const saved = localStorage.getItem('lkbb4_registrations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Otomatis bersihkan semua data sample dummy awal (reg-001 s/d reg-006)
        return parsed.filter((r: Pendaftaran) => !r.id.startsWith('reg-00') && r.id !== 'reg-sample');
      } catch {
        return [];
      }
    }
    return INITIAL_PENDAFTARAN;
  });

  const [bankConfig, setBankConfig] = useState<BankConfig>(() => {
    const saved = localStorage.getItem('lkbb4_bank');
    return saved ? JSON.parse(saved) : INITIAL_BANK;
  });

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    const saved = localStorage.getItem('lkbb4_sponsors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Bersihkan data dummy sponsor awal
        return parsed.filter((s: Sponsor) => !s.id.startsWith('sp-'));
      } catch {
        return [];
      }
    }
    return INITIAL_SPONSORS;
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('lkbb4_admin_pin') || '1945';
  });

  // Navigation & Sessions
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [adminSession, setAdminSession] = useState<AdminSession>(() => {
    const saved = sessionStorage.getItem('lkbb4_admin_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
        return parsed;
      }
    }
    return { isAuthenticated: false, token: null, expiresAt: null };
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Success dialog after new registration
  const [justRegistered, setJustRegistered] = useState<Pendaftaran | null>(null);

  // Real-time Firestore Database Synchronization across all devices & browsers
  useEffect(() => {
    // 1. Connectivity check & initial seed if empty
    testFirestoreConnection().then(connected => {
      setIsCloudConnected(connected);
      if (connected) {
        initializeDefaultSettingsIfEmpty({
          quotas: INITIAL_KUOTA,
          bankConfig: INITIAL_BANK,
          sponsors: INITIAL_SPONSORS,
          adminPin: '1945'
        });
      }
    });

    // 2. Real-time listener for registrations
    const unsubRegs = subscribeToRegistrations(
      (remoteRegs) => {
        setRegistrations(remoteRegs);
        localStorage.setItem('lkbb4_registrations', JSON.stringify(remoteRegs));
        setIsCloudConnected(true);
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    // 3. Real-time listener for system settings (quotas, bank, sponsors, PIN)
    const unsubSettings = subscribeToSettings(
      (remoteSettings) => {
        if (remoteSettings.quotas && Array.isArray(remoteSettings.quotas) && remoteSettings.quotas.length > 0) {
          setQuotas(remoteSettings.quotas);
          localStorage.setItem('lkbb4_quotas', JSON.stringify(remoteSettings.quotas));
        }
        if (remoteSettings.bankConfig && remoteSettings.bankConfig.bankName) {
          setBankConfig(remoteSettings.bankConfig);
          localStorage.setItem('lkbb4_bank', JSON.stringify(remoteSettings.bankConfig));
        }
        if (remoteSettings.sponsors && Array.isArray(remoteSettings.sponsors)) {
          setSponsors(remoteSettings.sponsors);
          localStorage.setItem('lkbb4_sponsors', JSON.stringify(remoteSettings.sponsors));
        }
        if (remoteSettings.adminPin) {
          setAdminPin(remoteSettings.adminPin);
          localStorage.setItem('lkbb4_admin_pin', remoteSettings.adminPin);
        }
        setIsCloudConnected(true);
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    return () => {
      unsubRegs();
      unsubSettings();
    };
  }, []);

  // Local storage fallback sync
  useEffect(() => {
    localStorage.setItem('lkbb4_quotas', JSON.stringify(quotas));
  }, [quotas]);

  useEffect(() => {
    localStorage.setItem('lkbb4_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('lkbb4_bank', JSON.stringify(bankConfig));
  }, [bankConfig]);

  useEffect(() => {
    localStorage.setItem('lkbb4_sponsors', JSON.stringify(sponsors));
  }, [sponsors]);

  useEffect(() => {
    localStorage.setItem('lkbb4_admin_pin', adminPin);
  }, [adminPin]);

  const [initialTrackingQuery, setInitialTrackingQuery] = useState('');

  // Auto-detect URL parameter (misal scan QR Code E-Ticket: ?tab=tracking&reg=REG-xxx)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const regParam = params.get('reg');
      if (regParam) {
        setInitialTrackingQuery(regParam);
      }
      if (tabParam) {
        if (!PROTECTED_TABS.includes(tabParam) || adminSession.isAuthenticated) {
          setCurrentTab(tabParam);
        }
      } else if (regParam) {
        setCurrentTab('tracking');
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'wheel':
        return 'Lucky Wheel TM';
      case 'idcards':
        return 'ID Card Peserta';
      case 'gas-code':
        return 'GAS Code';
      case 'admin':
        return 'Panel Panitia';
      default:
        return 'Menu Khusus Panitia';
    }
  };

  const handleSelectTab = (tab: string) => {
    if (PROTECTED_TABS.includes(tab) && !adminSession.isAuthenticated) {
      setPendingTab(tab);
      setIsPinModalOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleUpdatePin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('lkbb4_admin_pin', newPin);
    showToast('PIN Panitia berhasil diperbarui & disimpan di database!', 'success');
  };

  // Auth Handlers
  const handleAdminLoginSuccess = (token: string) => {
    const session: AdminSession = {
      isAuthenticated: true,
      token,
      expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 Hours
    };
    setAdminSession(session);
    sessionStorage.setItem('lkbb4_admin_session', JSON.stringify(session));
    const dest = pendingTab || 'admin';
    setCurrentTab(dest);
    setPendingTab(null);
    showToast(`Autentikasi PIN Berhasil! Membuka ${getTabTitle(dest)}. Sesi aktif 4 jam.`, 'success');
  };

  const handleAdminLogout = () => {
    const session: AdminSession = { isAuthenticated: false, token: null, expiresAt: null };
    setAdminSession(session);
    sessionStorage.removeItem('lkbb4_admin_session');
    if (PROTECTED_TABS.includes(currentTab)) {
      setCurrentTab('dashboard');
    }
    showToast('Sesi panitia telah dikunci & ditutup.', 'info');
  };

  // Periodic session expiration check
  useEffect(() => {
    if (!adminSession.isAuthenticated || !adminSession.expiresAt) return;
    const checkExpiry = () => {
      if (adminSession.expiresAt && Date.now() >= adminSession.expiresAt) {
        handleAdminLogout();
        showToast('Sesi panitia telah berakhir. Harap login kembali.', 'info');
      }
    };
    const interval = setInterval(checkExpiry, 30000);
    return () => clearInterval(interval);
  }, [adminSession]);

  // Registration Handlers
  const handleAddNewRegistration = async (newReg: Pendaftaran) => {
    setRegistrations(prev => [newReg, ...prev]);
    setJustRegistered(newReg);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });
    showToast(`Registrasi ${newReg.namaSekolah} berhasil dicatat & disinkronkan ke Cloud!`, 'success');
    try {
      await saveRegistrationToFirestore(newReg);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Simpan ke Firestore tertunda (tersimpan lokal):', err);
    }
  };

  // Status & Verification Handlers
  const handleUpdateStatus = (
    id: string, 
    newStatus: StatusPendaftaran, 
    catatan?: string, 
    customNoPeserta?: string
  ) => {
    let targetUpdated: Pendaftaran | null = null;
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === id) {
          let updatedNoPeserta = r.noPeserta;
          // Auto assign No Peserta if verified
          if (newStatus === 'Terverifikasi' && !updatedNoPeserta) {
            const prefix = r.jenjang === 'SD/MI' ? 'SD' : r.jenjang === 'SMP/MTs' ? 'SMP' : 'SMA';
            const count = prev.filter(p => p.jenjang === r.jenjang && p.noPeserta).length + 1;
            updatedNoPeserta = customNoPeserta || `${prefix}-${count.toString().padStart(2, '0')}`;
          }
          targetUpdated = {
            ...r,
            status: newStatus,
            catatanRevisi: catatan || '',
            noPeserta: updatedNoPeserta,
            tanggalVerifikasi: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
          };
          return targetUpdated;
        }
        return r;
      })
    );
    showToast('Status pendaftaran & No. Peserta berhasil diperbarui di cloud!', 'success');
    if (targetUpdated) {
      saveRegistrationToFirestore(targetUpdated).catch(() => {});
    }
  };

  // Pelunasan Susulan Handler
  const handlePelunasan = (id: string, nominalTambahan: number, catatan: string) => {
    let targetUpdated: Pendaftaran | null = null;
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === id) {
          const newBayar = r.nominalBayar + nominalTambahan;
          const newSisa = Math.max(0, r.nominalHarusBayar - newBayar);
          const newStatusBayar = newSisa === 0 ? 'Lunas' : 'DP';
          const riwayat = r.riwayatPelunasan || [];
          targetUpdated = {
            ...r,
            nominalBayar: newBayar,
            sisaPembayaran: newSisa,
            statusPembayaran: newStatusBayar,
            riwayatPelunasan: [
              ...riwayat,
              {
                id: 'pl-' + Date.now(),
                tanggal: new Date().toLocaleString('id-ID'),
                nominal: nominalTambahan,
                catatan
              }
            ]
          };
          return targetUpdated;
        }
        return r;
      })
    );
    showToast(`Pelunasan sebesar Rp ${nominalTambahan.toLocaleString('id-ID')} berhasil dicatat & disinkronkan!`, 'success');
    if (targetUpdated) {
      saveRegistrationToFirestore(targetUpdated).catch(() => {});
    }
  };

  // Lucky Wheel Number Drawing Saver
  const handleSaveNomorTampil = (regId: string, nomorTampil: number) => {
    let targetUpdated: Pendaftaran | null = null;
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === regId) {
          targetUpdated = { ...r, noTampil: nomorTampil };
          return targetUpdated;
        }
        return r;
      })
    );
    showToast(`Nomor Tampil ${nomorTampil} berhasil disimpan di cloud!`, 'success');
    if (targetUpdated) {
      saveRegistrationToFirestore(targetUpdated).catch(() => {});
    }
  };

  // Sponsor Handlers
  const handleAddSponsor = (sponsor: Sponsor) => {
    const next = [...sponsors, sponsor];
    setSponsors(next);
    saveSettingsToFirestore({ sponsors: next }).catch(() => {});
    showToast(`Sponsor ${sponsor.nama} ditambahkan ke cloud!`, 'success');
  };

  const handleDeleteSponsor = (id: string) => {
    const next = sponsors.filter(s => s.id !== id);
    setSponsors(next);
    saveSettingsToFirestore({ sponsors: next }).catch(() => {});
    showToast('Sponsor dihapus dari daftar.', 'info');
  };

  const handleDeleteRegistration = (id: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
    deleteRegistrationFromFirestore(id).catch(() => {});
    showToast('Data peleton berhasil dihapus dari cloud database.', 'info');
  };

  const handleResetAllRegistrations = async () => {
    const ids = registrations.map(r => r.id);
    setRegistrations([]);
    localStorage.removeItem('lkbb4_registrations');
    showToast('Seluruh data pendaftaran berhasil dibersihkan! Sistem kini siap menerima data riil.', 'success');
    for (const id of ids) {
      deleteRegistrationFromFirestore(id).catch(() => {});
    }
  };

  const handleUpdateQuotas = (newQuotas: KuotaJenjang[]) => {
    setQuotas(newQuotas);
    saveSettingsToFirestore({ quotas: newQuotas }).catch(() => {});
    showToast('Pengaturan kuota dan biaya pendaftaran berhasil disimpan ke cloud database!', 'success');
  };

  const handleUpdateBankConfig = (newCfg: BankConfig) => {
    setBankConfig(newCfg);
    saveSettingsToFirestore({ bankConfig: newCfg }).catch(() => {});
    showToast('Rekening resmi panitia berhasil disimpan ke cloud database!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        adminSession={adminSession}
        onOpenPinModal={() => {
          setPendingTab('admin');
          setIsPinModalOpen(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {currentTab === 'dashboard' && (
          <QuotaDashboard
            quotas={quotas}
            registrations={registrations}
            bankConfig={bankConfig}
            sponsors={sponsors}
            onStartRegister={() => setCurrentTab('register')}
            onOpenTracking={() => setCurrentTab('tracking')}
          />
        )}

        {currentTab === 'register' && (
          <RegistrationWizard
            quotas={quotas}
            bankConfig={bankConfig}
            onSubmitRegistration={handleAddNewRegistration}
            onSuccessRegistered={(newReg) => {
              setJustRegistered(newReg);
            }}
          />
        )}

        {currentTab === 'tracking' && (
          <TrackingAndETicket 
            registrations={registrations} 
            initialSearchQuery={initialTrackingQuery}
          />
        )}

        {/* Protected Menu 1: Lucky Wheel TM */}
        {currentTab === 'wheel' && (
          adminSession.isAuthenticated ? (
            <LuckyWheel
              registrations={registrations}
              onSaveNomorTampil={handleSaveNomorTampil}
            />
          ) : (
            <AccessRestrictedCard
              title="Lucky Wheel TM"
              description="Fitur pengundian nomor urut tampil peleton diproteksi PIN keamanan dan hanya dapat dioperasikan oleh panitia pelaksana saat agenda Technical Meeting (TM) resmi."
              onUnlock={() => {
                setPendingTab('wheel');
                setIsPinModalOpen(true);
              }}
            />
          )
        )}

        {/* Protected Menu 2: ID Card Peserta */}
        {currentTab === 'idcards' && (
          adminSession.isAuthenticated ? (
            <IdCardModule registrations={registrations} />
          ) : (
            <AccessRestrictedCard
              title="ID Card Peserta"
              description="Modul pencetakan ID Card peserta resmi dilindungi PIN keamanan panitia untuk mencegah akses dan pencetakan tanpa izin oleh peserta."
              onUnlock={() => {
                setPendingTab('idcards');
                setIsPinModalOpen(true);
              }}
            />
          )
        )}

        {/* Protected Menu 3: Panel Panitia */}
        {currentTab === 'admin' && (
          adminSession.isAuthenticated ? (
            <AdminPanel
              registrations={registrations}
              bankConfig={bankConfig}
              sponsors={sponsors}
              quotas={quotas}
              currentPin={adminPin}
              onUpdatePin={handleUpdatePin}
              onUpdateStatus={handleUpdateStatus}
              onPelunasan={handlePelunasan}
              onUpdateBankConfig={handleUpdateBankConfig}
              onUpdateQuotas={handleUpdateQuotas}
              onAddSponsor={handleAddSponsor}
              onDeleteSponsor={handleDeleteSponsor}
              onDeleteRegistration={handleDeleteRegistration}
              onResetAllRegistrations={handleResetAllRegistrations}
            />
          ) : (
            <AccessRestrictedCard
              title="Panel Panitia"
              description="Pusat verifikasi berkas, penerbitan nomor peserta resmi, dan rekonsiliasi kas hanya dapat diakses oleh Panitia LKBB Garuda IV berwenang."
              onUnlock={() => {
                setPendingTab('admin');
                setIsPinModalOpen(true);
              }}
            />
          )
        )}

        {/* Protected Menu 4: GAS Code */}
        {currentTab === 'gas-code' && (
          adminSession.isAuthenticated ? (
            <GasCodeViewer />
          ) : (
            <AccessRestrictedCard
              title="GAS Code"
              description="Skrip backend Google Apps Script dan struktur spreadsheet database sistem memuat konfigurasi server sensitif khusus panitia."
              onUnlock={() => {
                setPendingTab('gas-code');
                setIsPinModalOpen(true);
              }}
            />
          )
        )}
      </main>

      {/* PIN Security Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingTab(null);
        }}
        onSuccess={handleAdminLoginSuccess}
        currentPin={adminPin}
        targetMenuTitle={pendingTab ? getTabTitle(pendingTab) : 'Menu Khusus Panitia'}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Post Registration Success Dialog */}
      {justRegistered && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-8 text-center shadow-2xl space-y-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                REGISTRASI BERHASIL DICATAT
              </span>
              <h3 className="text-xl font-black text-white">
                Selamat Datang, {justRegistered.namaSekolah}!
              </h3>
              <p className="text-xs text-slate-400">
                Peleton <b>{justRegistered.namaPeleton}</b> telah berhasil didaftarkan ke sistem LKBB GARUDA IV.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">NO. REGISTRASI ANDA:</div>
              <div className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                {justRegistered.noRegistrasi}
              </div>
              <div className="text-[11px] text-slate-400">
                Gunakan nomor ini untuk mengecek status dan mengunduh E-Ticket resmi.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setJustRegistered(null);
                  setCurrentTab('dashboard');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Kembali ke Beranda
              </button>
              <button
                type="button"
                onClick={() => {
                  setJustRegistered(null);
                  setCurrentTab('tracking');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25"
              >
                <Ticket className="w-4 h-4" />
                <span>Lihat Status & E-Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Footer */}
      <footer className="no-print mt-auto border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <div className="font-bold text-slate-300">
              LKBB GARUDA IV · SMKS PGRI 1 KOTA SUKABUMI
            </div>
            <div className="text-[11px] text-slate-500">
              Sekretariat: Jl. Pelabuhan II Perum Cipoho Indah, Cikondang, Kec. Citamiang, Kota Sukabumi, Jawa Barat 43141 · Telp: (0266) 224277
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-mono">
            Powered by Google Apps Script & Sheets Database · Paskibra Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
