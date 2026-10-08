import React, { useState } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Search, 
  Eye, 
  EyeOff,
  ExternalLink, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  Building, 
  Users, 
  X, 
  Save,
  CreditCard,
  Image as ImageIcon,
  Upload,
  Check,
  AlertTriangle,
  ShieldAlert,
  Lock,
  KeyRound,
  Dices,
  FileCode,
  MessageCircle,
  Send,
  Download,
  ZoomIn,
  Maximize2,
  Layers
} from 'lucide-react';
import { 
  Pendaftaran, 
  StatusPendaftaran, 
  BankConfig, 
  Sponsor, 
  Jenjang,
  KuotaJenjang
} from '../types';
import { hashPin, isSha256Hash } from '../utils/security';
import { processLogoFile } from '../utils/imageUtils';
import { SponsorLogo } from './SponsorLogo';
import { getVerificationWhatsAppUrl } from '../utils/whatsapp';
import { 
  isPdfDocument, 
  openDocumentInNewTab, 
  downloadDocumentFile, 
  DEFAULT_SURAT_TUGAS_PREVIEW 
} from '../utils/documentViewer';

interface AdminPanelProps {
  registrations: Pendaftaran[];
  bankConfig: BankConfig;
  sponsors: Sponsor[];
  quotas: KuotaJenjang[];
  currentPin: string;
  onUpdatePin: (newPin: string) => void;
  onUpdateStatus: (id: string, newStatus: StatusPendaftaran, catatan?: string, customNoPeserta?: string) => void;
  onPelunasan: (id: string, nominalTambahan: number, catatan: string) => void;
  onUpdateBankConfig: (newConfig: BankConfig) => void;
  onUpdateQuotas: (newQuotas: KuotaJenjang[]) => void;
  onAddSponsor: (sponsor: Sponsor) => void;
  onDeleteSponsor: (id: string) => void;
  onDeleteRegistration?: (id: string) => void;
  onResetAllRegistrations?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  registrations,
  bankConfig,
  sponsors,
  quotas,
  currentPin,
  onUpdatePin,
  onUpdateStatus,
  onPelunasan,
  onUpdateBankConfig,
  onUpdateQuotas,
  onAddSponsor,
  onDeleteSponsor,
  onDeleteRegistration,
  onResetAllRegistrations
}) => {
  const [activeTab, setActiveTab] = useState<'verifikasi' | 'settings'>('verifikasi');
  const [filterJenjang, setFilterJenjang] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedReg, setSelectedReg] = useState<Pendaftaran | null>(null);
  const [statusDraft, setStatusDraft] = useState<StatusPendaftaran>('Terverifikasi');
  const [catatanDraft, setCatatanDraft] = useState('');
  const [noPesertaDraft, setNoPesertaDraft] = useState('');
  const [verifiedPromptReg, setVerifiedPromptReg] = useState<Pendaftaran | null>(null);

  // In-App Confirmation States (Bypasses iframe window.confirm blocking)
  const [peletonToDelete, setPeletonToDelete] = useState<Pendaftaran | null>(null);
  const [isConfirmingResetAll, setIsConfirmingResetAll] = useState<boolean>(false);

  // Lightbox Document Preview State (Ukuran Penuh & PDF Viewer)
  const [previewLightbox, setPreviewLightbox] = useState<{
    title: string;
    url: string;
    fileName: string;
    isPdf: boolean;
  } | null>(null);

  // Close lightbox on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewLightbox) {
        setPreviewLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewLightbox]);

  // Pelunasan Susulan Modal State
  const [pelunasanReg, setPelunasanReg] = useState<Pendaftaran | null>(null);
  const [nominalTambahan, setNominalTambahan] = useState<number>(0);
  const [catatanPelunasan, setCatatanPelunasan] = useState('');

  // Settings State: Bank Config Form
  const [bankForm, setBankForm] = useState<BankConfig>({ ...bankConfig });
  const [bankSavedMessage, setBankSavedMessage] = useState(false);

  // Settings State: Master Quotas & Fees Form
  const [quotasForm, setQuotasForm] = useState<KuotaJenjang[]>(() => quotas);
  const [quotasSavedMessage, setQuotasSavedMessage] = useState(false);

  React.useEffect(() => {
    setQuotasForm(quotas);
  }, [quotas]);

  const handleQuotaChange = <K extends keyof KuotaJenjang>(index: number, field: K, value: KuotaJenjang[K]) => {
    setQuotasForm(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveQuotasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateQuotas(quotasForm);
    setQuotasSavedMessage(true);
    setTimeout(() => setQuotasSavedMessage(false), 3500);
  };

  // Settings State: PIN Management Form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');

  // Settings State: Add Sponsor Form
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [sponsorType, setSponsorType] = useState<'Utama' | 'Pendukung' | 'Media Partner'>('Pendukung');
  const [sponsorUploadMode, setSponsorUploadMode] = useState<'file' | 'url'>('file');
  const [sponsorFileLoading, setSponsorFileLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState('');
  const [uploadedLogoFileName, setUploadedLogoFileName] = useState('');
  const sponsorFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Compute Real Verified Financial Reconciliation
  const verifiedList = registrations.filter(r => r.status === 'Terverifikasi');
  const totalKasSah = verifiedList.reduce((acc, r) => acc + r.nominalBayar, 0);
  const kasSD = verifiedList.filter(r => r.jenjang === 'SD/MI').reduce((acc, r) => acc + r.nominalBayar, 0);
  const kasSMP = verifiedList.filter(r => r.jenjang === 'SMP/MTs').reduce((acc, r) => acc + r.nominalBayar, 0);
  const kasSMA = verifiedList.filter(r => r.jenjang === 'SMA/SMK/MA').reduce((acc, r) => acc + r.nominalBayar, 0);
  const totalPiutangDP = verifiedList.reduce((acc, r) => acc + r.sisaPembayaran, 0);

  // Filtered registrations
  const filteredRegs = registrations.filter((r) => {
    if (filterJenjang !== 'All' && r.jenjang !== filterJenjang) return false;
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.namaSekolah.toLowerCase().includes(q) ||
        r.noRegistrasi.toLowerCase().includes(q) ||
        r.namaPeleton.toLowerCase().includes(q) ||
        (r.noPeserta && r.noPeserta.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenReview = (item: Pendaftaran) => {
    setSelectedReg(item);
    setStatusDraft(item.status);
    setCatatanDraft(item.catatanRevisi || '');
    setNoPesertaDraft(item.noPeserta || '');
  };

  const handleSaveReview = () => {
    if (!selectedReg) return;
    const isNowVerified = statusDraft === 'Terverifikasi';
    const updatedItem: Pendaftaran = {
      ...selectedReg,
      status: statusDraft,
      catatanRevisi: catatanDraft,
      noPeserta: noPesertaDraft
    };
    onUpdateStatus(selectedReg.id, statusDraft, catatanDraft, noPesertaDraft);
    setSelectedReg(null);

    // Jika dinyatakan Terverifikasi / Sah oleh panitia, buka prompt otomatis untuk mengirim pesan WhatsApp ke Pembina
    if (isNowVerified) {
      setVerifiedPromptReg(updatedItem);
    }
  };

  const handleOpenPelunasan = (item: Pendaftaran) => {
    setPelunasanReg(item);
    setNominalTambahan(item.sisaPembayaran);
    setCatatanPelunasan('Pelunasan sisa biaya registrasi');
  };

  const handleSavePelunasan = () => {
    if (!pelunasanReg) return;
    onPelunasan(pelunasanReg.id, nominalTambahan, catatanPelunasan);
    setPelunasanReg(null);
  };

  const handleSaveBankForm = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankConfig(bankForm);
    setBankSavedMessage(true);
    setTimeout(() => setBankSavedMessage(false), 2500);
  };

  const handleSponsorFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSponsorError('');
    setSponsorFileLoading(true);
    try {
      const optimizedUrl = await processLogoFile(file);
      setSponsorLogoUrl(optimizedUrl);
      setUploadedLogoFileName(file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar logo';
      setSponsorError(msg);
    } finally {
      setSponsorFileLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSponsorError('');
    if (!sponsorName.trim()) {
      setSponsorError('Nama sponsor / instansi wajib diisi');
      return;
    }
    if (!sponsorLogoUrl.trim()) {
      setSponsorError('Harap unggah berkas logo atau masukkan tautan URL logo');
      return;
    }

    onAddSponsor({
      id: 'sp-' + Date.now(),
      nama: sponsorName.trim(),
      logoUrl: sponsorLogoUrl.trim(),
      tipe: sponsorType
    });

    setSponsorName('');
    setSponsorLogoUrl('');
    setUploadedLogoFileName('');
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    if (newPin.trim().length < 4) {
      setPinChangeError('PIN baru minimal harus 4 karakter/angka!');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinChangeError('Konfirmasi PIN baru tidak cocok dengan PIN yang dimasukkan!');
      return;
    }

    try {
      const hashedPin = await hashPin(newPin.trim());
      onUpdatePin(hashedPin);
      setPinChangeSuccess('PIN panitia berhasil dienkripsi (SHA-256) dan tersimpan permanen di database!');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        setPinChangeSuccess('');
      }, 4500);
    } catch {
      setPinChangeError('Gagal mengenkripsi PIN baru. Silakan coba kembali.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            PANEL TERBATAS PANITIA & KASIR
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>Manajemen Verifikasi, Rekonsiliasi Kas & Konfigurasi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Validasi berkas legalitas, terbitkan Nomor Peserta resmi, kelola sisa pembayaran, dan pengaturan sistem.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#101b35] border border-[#1e2d4d] rounded-xl">
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'verifikasi'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Verifikasi & Registrasi ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pengaturan Sistem, PIN & Sponsor
          </button>
        </div>
      </div>

      {activeTab === 'verifikasi' ? (
        <div className="space-y-8">
          {/* REAL FINANCIAL RECONCILIATION WIDGET */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Kas Riil Masuk */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-[#0e172e] border border-emerald-800/60 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>TOTAL KAS SAH MASUK</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                Rp {totalKasSah.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                {verifiedList.length} Peleton Sah Terverifikasi
              </div>
            </div>

            {/* Kas SD */}
            <div className="p-5 rounded-2xl bg-[#101b35] border border-[#1e2d4d] shadow-xl">
              <div className="text-xs font-mono text-slate-400">KAS TINGKAT SD/MI</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-2">
                Rp {kasSD.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {verifiedList.filter(r => r.jenjang === 'SD/MI').length} Peleton Sah
              </div>
            </div>

            {/* Kas SMP */}
            <div className="p-5 rounded-2xl bg-[#101b35] border border-[#1e2d4d] shadow-xl">
              <div className="text-xs font-mono text-slate-400">KAS TINGKAT SMP/MTs</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-2">
                Rp {kasSMP.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {verifiedList.filter(r => r.jenjang === 'SMP/MTs').length} Peleton Sah
              </div>
            </div>

            {/* Kas SMA */}
            <div className="p-5 rounded-2xl bg-[#101b35] border border-[#1e2d4d] shadow-xl">
              <div className="text-xs font-mono text-slate-400">KAS TINGKAT SMA/SMK/MA</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-2">
                Rp {kasSMA.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {verifiedList.filter(r => r.jenjang === 'SMA/SMK/MA').length} Peleton Sah
              </div>
            </div>

            {/* Total Piutang DP */}
            <div className="p-5 rounded-2xl bg-[#101b35] border border-[#1e2d4d] shadow-xl">
              <div className="text-xs font-mono text-amber-400">SISA PIUTANG DP</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-2">
                Rp {totalPiutangDP.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Menunggu Pelunasan Sebelum TM
              </div>
            </div>
          </div>

          {/* Filtering & Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama sekolah, peleton, no reg..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Jenjang Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Jenjang:</span>
                <select
                  value={filterJenjang}
                  onChange={(e) => setFilterJenjang(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">Semua Jenjang</option>
                  <option value="SD/MI">SD/MI</option>
                  <option value="SMP/MTs">SMP/MTs</option>
                  <option value="SMA/SMK/MA">SMA/SMK/MA</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">Semua Status</option>
                  <option value="Terverifikasi">Terverifikasi</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Ditolak">Ditolak</option>
                  <option value="Tahan">Tahan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table of Registrations */}
          <div className="bg-[#101b35] border border-[#1e2d4d] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] text-slate-400 font-mono text-[10px] uppercase border-b border-[#1e2d4d]">
                  <tr>
                    <th className="px-4 py-3">No. Reg / Peserta</th>
                    <th className="px-4 py-3">Pangkalan Sekolah</th>
                    <th className="px-4 py-3">Jenjang</th>
                    <th className="px-4 py-3">Pembina / Pelatih</th>
                    <th className="px-4 py-3">Pembayaran</th>
                    <th className="px-4 py-3">Status Verifikasi</th>
                    <th className="px-4 py-3 text-right">Tindakan Panitia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredRegs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Tidak ada data pendaftaran yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredRegs.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-amber-400">{reg.noRegistrasi}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            No. Peserta: <b className="text-white">{reg.noPeserta || '-'}</b>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-white text-sm">{reg.namaSekolah}</div>
                          <div className="text-slate-400 text-[11px]">
                            {reg.namaPeleton} ({reg.kotaAsal})
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-slate-300">
                          {reg.jenjang}
                        </td>

                        <td className="px-4 py-3 text-[11px]">
                          <div className="space-y-1.5 min-w-[210px]">
                            <div>
                              <span className="text-slate-400 font-medium">Pembina: </span>
                              <span className="font-semibold text-white">{reg.namaPembina}</span>
                            </div>

                            {/* Nomor WhatsApp Pembina (Diaktifkan untuk verifikasi / cek E-ticket) */}
                            <div>
                              {reg.status === 'Terverifikasi' ? (
                                <a
                                  href={getVerificationWhatsAppUrl(reg)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/60 text-[11px] font-semibold transition-all group shadow-sm"
                                  title="Nomor WhatsApp Pembina aktif: Klik untuk mengirim pesan hasil verifikasi sah & pemberitahuan cek E-Ticket resmi di aplikasi"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white shrink-0 animate-pulse" />
                                  <span className="font-mono">{reg.noWaPembina}</span>
                                  <span className="text-[10px] bg-emerald-800/90 group-hover:bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-100 group-hover:text-white font-bold ml-0.5 flex items-center gap-1">
                                    <Send className="w-2.5 h-2.5" />
                                    Kirim E-Ticket WA
                                  </span>
                                </a>
                              ) : (
                                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                                  <span className="text-slate-300">WA: {reg.noWaPembina}</span>
                                  <span 
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-sans italic border border-slate-700/60"
                                    title="Pesan verifikasi E-Ticket WA aktif otomatis setelah panitia menetapkan status Terverifikasi / Sah"
                                  >
                                    Aktif saat Sah
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/60">
                              Pelatih: {reg.namaPelatih} ({reg.noWaPelatih})
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              reg.statusPembayaran === 'Lunas' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                            }`}>
                              {reg.statusPembayaran}
                            </span>
                            <span className="font-mono text-white">
                              Rp {reg.nominalBayar.toLocaleString('id-ID')}
                            </span>
                          </div>
                          {reg.sisaPembayaran > 0 && (
                            <div className="text-[10px] text-red-400 mt-0.5">
                              Sisa: Rp {reg.sisaPembayaran.toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${
                            reg.status === 'Terverifikasi'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : reg.status === 'Perlu Perbaikan'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                              : reg.status === 'Ditolak'
                              ? 'bg-red-950/80 text-red-400 border border-red-800'
                              : 'bg-sky-950/80 text-sky-400 border border-sky-800'
                          }`}>
                            {reg.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.sisaPembayaran > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenPelunasan(reg)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold"
                                title="Catat Pelunasan DP"
                              >
                                + Pelunasan
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenReview(reg)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Tinjau</span>
                            </button>
                            {onDeleteRegistration && (
                              <button
                                type="button"
                                onClick={() => setPeletonToDelete(reg)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/60 border border-transparent hover:border-red-800/60 transition-colors"
                                title="Hapus Data Peleton Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB SETTINGS: KEAMANAN PIN, REKENING BANK & SPONSORS */
        <div className="space-y-8">
          {/* PIN Security & Protected Menus Card (Database Managed) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Keamanan PIN Database & Proteksi Menu
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Aktif di Database
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PIN ini tersimpan pada database sistem dan memproteksi menu-menu krusial agar tidak dapat diakses oleh peserta.
                  </p>
                </div>
              </div>

              {/* Current PIN Status Pill */}
              <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
                <div className="text-left">
                  <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Status Proteksi PIN:</span>
                  </div>
                  <div className="font-mono font-bold text-xs mt-0.5">
                    {isSha256Hash(currentPin) ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <span>Terenkripsi SHA-256 (Kriptografis 1-Arah)</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">
                        PIN Standar ({showCurrentPin ? currentPin : '••••'})
                      </span>
                    )}
                  </div>
                </div>
                {!isSha256Hash(currentPin) && (
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title={showCurrentPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Protected Menus Overview */}
            <div className="py-4 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block mb-2">
                4 Menu yang Otomatis Dilindungi oleh PIN Database:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5">
                  <Dices className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Lucky Wheel TM</div>
                    <div className="text-[10px] text-slate-400">Pengundian nomor urut tampil</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">ID Card Peserta</div>
                    <div className="text-[10px] text-slate-400">Pencetakan atribut resmi</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">GAS Code</div>
                    <div className="text-[10px] text-slate-400">Skrip backend Google Sheets</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Panel Panitia</div>
                    <div className="text-[10px] text-slate-400">Verifikasi berkas & kas lomba</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change PIN Form */}
            <form onSubmit={handleSaveNewPin} className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Ubah PIN Panitia (Simpan ke Database)</span>
                <span className="text-[10px] text-slate-400">Gunakan kombinasi yang hanya diketahui oleh panitia</span>
              </div>

              {pinChangeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              {pinChangeError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    PIN Baru (Minimal 4 karakter) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Masukkan PIN baru"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Konfirmasi PIN Baru <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Ketik ulang PIN baru"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!newPin.trim() || !confirmPin.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Perbarui & Simpan PIN ke Database</span>
                </button>
              </div>
            </form>
          </div>

          {/* Master Kuota & Biaya Pendaftaran Per Jenjang */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    MASTER DATABASE KUOTA & BIAYA
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Tersimpan di Database
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Pengaturan Biaya Pendaftaran & Kuota Per Tingkat</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pengaturan biaya pendaftaran penuh, minimal DP, kuota peleton maksimal, dan syarat komposisi pasukan per jenjang (SD/MI, SMP/MTs, SMA/SMK/MA) tersimpan di database dan berlaku otomatis di seluruh formulir registrasi.
                </p>
              </div>
            </div>

            {quotasSavedMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Pengaturan biaya pendaftaran dan kuota per jenjang berhasil disimpan ke database!</span>
              </div>
            )}

            <form onSubmit={handleSaveQuotasSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quotasForm.map((q, idx) => (
                  <div key={q.jenjang} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-lg">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          TINGKAT {q.jenjang}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Database #{idx + 1}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white pt-1">
                        Jenjang {q.jenjang}
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">
                          Biaya Pendaftaran Penuh (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          required
                          value={q.biayaPendaftaran}
                          onChange={(e) => handleQuotaChange(idx, 'biayaPendaftaran', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">
                          Minimal Uang Muka (DP) (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          required
                          value={q.dpMinimal}
                          onChange={(e) => handleQuotaChange(idx, 'dpMinimal', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">
                          Batas Kuota Maksimal (Peleton):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          required
                          value={q.kuotaMaks}
                          onChange={(e) => handleQuotaChange(idx, 'kuotaMaks', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">
                          Keterangan / Komposisi Tim:
                        </label>
                        <input
                          type="text"
                          required
                          value={q.keterangan}
                          onChange={(e) => handleQuotaChange(idx, 'keterangan', e.target.value)}
                          placeholder="Contoh: 16 Pasukan + 1 Danton + 2 Official"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Kuota & Biaya ke Database</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bank Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>Pengaturan Rekening Pembayaran Panitia</span>
              </h3>
              {bankSavedMessage && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBankForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Bank Resmi</label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  required
                  value={bankForm.nomorRekening}
                  onChange={(e) => setBankForm({ ...bankForm, nomorRekening: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Pemilik Rekening (Atas Nama)</label>
                <input
                  type="text"
                  required
                  value={bankForm.atasNama}
                  onChange={(e) => setBankForm({ ...bankForm, atasNama: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Instruksi Transfer untuk Peserta</label>
                <textarea
                  rows={3}
                  value={bankForm.instruksi}
                  onChange={(e) => setBankForm({ ...bankForm, instruksi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Rekening</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sponsors Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Pengelola Sponsor & Logo Mitra</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tambahkan instansi mitra pendukung yang ditampilkan pada beranda publik.
              </p>
            </div>

            {/* Add Sponsor Form */}
            <form onSubmit={handleAddSponsorSubmit} className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">Tambah Sponsor Baru</span>
                <span className="text-[10px] text-slate-400">Otomatis dioptimalkan & anti-rusak</span>
              </div>

              {sponsorError && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{sponsorError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Nama Sponsor / Instansi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Contoh: Bank BJB / PT Sukabumi Raya"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Upload Mode Selector */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">
                  Metode Masukan Logo <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSponsorUploadMode('file');
                      setSponsorError('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      sponsorUploadMode === 'file'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Berkas Gambar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSponsorUploadMode('url');
                      setSponsorError('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      sponsorUploadMode === 'url'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Input Tautan URL</span>
                  </button>
                </div>
              </div>

              {/* Mode: FILE UPLOAD */}
              {sponsorUploadMode === 'file' && (
                <div>
                  <input
                    ref={sponsorFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleSponsorFileSelect}
                    className="hidden"
                  />

                  {sponsorFileLoading ? (
                    <div className="p-6 border-2 border-dashed border-amber-500/50 rounded-xl bg-amber-500/5 text-center space-y-2">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <div className="text-xs font-semibold text-amber-400">Mengoptimasi & Menjaga Kualitas Logo...</div>
                      <div className="text-[10px] text-slate-400">Kompresi cerdas agar tidak rusak & ramah penyimpanan</div>
                    </div>
                  ) : sponsorLogoUrl && uploadedLogoFileName ? (
                    <div className="p-3 bg-slate-900 border border-emerald-800/80 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white p-1.5 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                          <img src={sponsorLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[200px]">{uploadedLogoFileName}</div>
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3" /> Siap Digunakan & Teroptimasi
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => sponsorFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => sponsorFileInputRef.current?.click()}
                      className="p-5 border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-xl bg-slate-900/50 hover:bg-slate-900 text-center cursor-pointer transition-all space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-white">Klik untuk memilih file logo</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format PNG (transparan disarankan), JPG, SVG, atau WebP (Maks. 10 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: URL INPUT */}
              {sponsorUploadMode === 'url' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tautan URL Logo (Gambar Online)</label>
                  <input
                    type="url"
                    value={sponsorLogoUrl}
                    onChange={(e) => {
                      setSponsorLogoUrl(e.target.value);
                      setUploadedLogoFileName('');
                    }}
                    placeholder="https://example.com/logo-resmi.png"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                  {sponsorLogoUrl && (
                    <div className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200">
                        <img
                          src={sponsorLogoUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">Pratinjau logo URL</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kategori Kemitraan</label>
                <select
                  value={sponsorType}
                  onChange={(e) => setSponsorType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Utama">Sponsor Utama</option>
                  <option value="Pendukung">Sponsor Pendukung</option>
                  <option value="Media Partner">Media Partner</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sponsorFileLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan & Tambahkan Sponsor</span>
              </button>
            </form>

            {/* List of existing sponsors */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Daftar Sponsor Aktif ({sponsors.length}):</div>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                {sponsors.map((sp) => (
                  <div key={sp.id} className="p-3 bg-slate-950 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <SponsorLogo
                        src={sp.logoUrl}
                        alt={sp.nama}
                        containerClassName="w-10 h-10 rounded-lg bg-white p-1.5 flex items-center justify-center border border-slate-700/80 shadow-sm shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white">{sp.nama}</div>
                        <div className="text-[10px] text-amber-400 uppercase font-mono">{sp.tipe}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteSponsor(sp.id)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-950 transition-colors"
                      title="Hapus Sponsor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pembersihan & Reset Data Sistem */}
          <div className="bg-slate-900/90 border border-red-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Pembersihan Database & Data Pendaftaran</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fitur ini digunakan oleh panitia pelaksana untuk mengosongkan seluruh data pendaftaran (misalnya setelah simulasi atau pengujian selesai) sehingga sistem murni hanya berisi data riil peserta resmi yang diinput oleh sekolah/pembina.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingResetAll(true)}
                className="px-5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-red-950/50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Seluruh Data Pendaftaran ({registrations.length} Peleton Tersimpan)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* REVIEW & VERIFICATION MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-8">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
                  PENINJAUAN BERKAS & VALIDASI
                </span>
                <h3 className="text-base font-bold text-white">{selectedReg.namaSekolah}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Team General info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-slate-500 font-mono text-[10px]">NO REGISTRASI</div>
                  <div className="font-mono font-bold text-amber-400">{selectedReg.noRegistrasi}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono text-[10px]">JENJANG</div>
                  <div className="font-bold text-white">{selectedReg.jenjang}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono text-[10px]">PELETON</div>
                  <div className="font-bold text-white">{selectedReg.namaPeleton}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono text-[10px]">KOTA ASAL</div>
                  <div className="font-bold text-white">{selectedReg.kotaAsal}</div>
                </div>
              </div>

              {/* Uploaded Documents Review */}
              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Berkas yang Diunggah Pendaftar:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bukti Bayar */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>1. Bukti Pembayaran</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 text-[11px]">
                        Rp {selectedReg.nominalBayar.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {selectedReg.buktiBayarUrl ? (
                      <div className="space-y-2">
                        {isPdfDocument(selectedReg.buktiBayarUrl, selectedReg.buktiBayarNama) ? (
                          /* PDF Card */
                          <div 
                            onClick={() => setPreviewLightbox({
                              title: 'Bukti Pembayaran (PDF)',
                              url: selectedReg.buktiBayarUrl,
                              fileName: selectedReg.buktiBayarNama || 'Bukti_Transfer.pdf',
                              isPdf: true
                            })}
                            className="h-36 rounded-xl border border-slate-700 bg-slate-900/90 hover:border-amber-500/60 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                              <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white mt-2 line-clamp-1">
                              {selectedReg.buktiBayarNama || 'Bukti_Pembayaran.pdf'}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                              Dokumen PDF · Klik untuk Meninjau
                            </span>
                          </div>
                        ) : (
                          /* Image Preview with Zoom overlay */
                          <div 
                            onClick={() => setPreviewLightbox({
                              title: 'Bukti Pembayaran',
                              url: selectedReg.buktiBayarUrl,
                              fileName: selectedReg.buktiBayarNama || 'Bukti_Transfer.jpg',
                              isPdf: false
                            })}
                            className="relative h-36 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden cursor-pointer group flex items-center justify-center"
                          >
                            <img
                              src={selectedReg.buktiBayarUrl}
                              alt="Bukti Transfer"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-[11px] backdrop-blur-[2px]">
                              <ZoomIn className="w-4 h-4 text-amber-400" />
                              <span>Perbesar Gambar</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewLightbox({
                              title: 'Bukti Pembayaran',
                              url: selectedReg.buktiBayarUrl,
                              fileName: selectedReg.buktiBayarNama || 'Bukti_Transfer.jpg',
                              isPdf: isPdfDocument(selectedReg.buktiBayarUrl, selectedReg.buktiBayarNama)
                            })}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Buka Ukuran Penuh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocumentInNewTab(selectedReg.buktiBayarUrl, selectedReg.buktiBayarNama || 'Bukti_Transfer')}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-800"
                            title="Buka dokumen di tab baru browser secara aman"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Tab Baru</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <FileText className="w-6 h-6 mb-1 opacity-50" />
                        <span>Tidak ada berkas bukti pembayaran</span>
                      </div>
                    )}
                  </div>

                  {/* Surat Tugas */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>2. Surat Tugas Resmi</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Kepala Sekolah
                      </span>
                    </div>

                    {selectedReg.suratTugasUrl ? (
                      <div className="space-y-2">
                        {isPdfDocument(selectedReg.suratTugasUrl, selectedReg.suratTugasNama) ? (
                          /* PDF Card */
                          <div 
                            onClick={() => setPreviewLightbox({
                              title: 'Surat Tugas Resmi Kepala Sekolah (PDF)',
                              url: selectedReg.suratTugasUrl,
                              fileName: selectedReg.suratTugasNama || 'Surat_Tugas_Kepsek.pdf',
                              isPdf: true
                            })}
                            className="h-36 rounded-xl border border-slate-700 bg-slate-900/90 hover:border-amber-500/60 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                              <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white mt-2 line-clamp-1">
                              {selectedReg.suratTugasNama || 'Surat_Tugas_Resmi.pdf'}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                              Dokumen PDF · Klik untuk Meninjau
                            </span>
                          </div>
                        ) : (
                          /* Image Preview with Zoom overlay and robust fallback */
                          <div 
                            onClick={() => setPreviewLightbox({
                              title: 'Surat Tugas Resmi Kepala Sekolah',
                              url: selectedReg.suratTugasUrl || DEFAULT_SURAT_TUGAS_PREVIEW,
                              fileName: selectedReg.suratTugasNama || 'Surat_Tugas.jpg',
                              isPdf: false
                            })}
                            className="relative h-36 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden cursor-pointer group flex items-center justify-center"
                          >
                            <img
                              src={selectedReg.suratTugasUrl}
                              alt="Surat Tugas Resmi"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_SURAT_TUGAS_PREVIEW;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-[11px] backdrop-blur-[2px]">
                              <ZoomIn className="w-4 h-4 text-amber-400" />
                              <span>Perbesar Berkas</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewLightbox({
                              title: 'Surat Tugas Resmi Kepala Sekolah',
                              url: selectedReg.suratTugasUrl || DEFAULT_SURAT_TUGAS_PREVIEW,
                              fileName: selectedReg.suratTugasNama || 'Surat_Tugas_Resmi',
                              isPdf: isPdfDocument(selectedReg.suratTugasUrl, selectedReg.suratTugasNama)
                            })}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Buka Berkas Ukuran Penuh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocumentInNewTab(selectedReg.suratTugasUrl || DEFAULT_SURAT_TUGAS_PREVIEW, selectedReg.suratTugasNama || 'Surat_Tugas')}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-800"
                            title="Buka berkas di tab baru browser secara aman"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Tab Baru</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <FileText className="w-6 h-6 mb-1 opacity-50" />
                        <span>Tidak ada berkas surat tugas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Members List preview */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Daftar Anggota Peleton ({selectedReg.anggota.length} Siswa):</span>
                  </h4>
                  <span className="text-[11px] font-mono text-amber-400">
                    Danton: {selectedReg.anggota.find(a => a.peran === 'Danton')?.nama || 'Belum Ada'}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">No</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">NISN</th>
                        <th className="px-3 py-2">Peran</th>
                        <th className="px-3 py-2">Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedReg.anggota.map((m, i) => (
                        <tr key={m.id} className={m.peran === 'Danton' ? 'bg-amber-500/10' : ''}>
                          <td className="px-3 py-1.5 font-mono text-slate-500">{i + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-white">{m.nama}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-400">{m.nisn}</td>
                          <td className="px-3 py-1.5 font-medium">{m.peran}</td>
                          <td className="px-3 py-1.5">{m.kelas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions & Decision */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Ubah Status Verifikasi:
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as StatusPendaftaran)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Terverifikasi">Terverifikasi / Sah</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan (Kirim Catatan)</option>
                      <option value="Ditolak">Ditolak</option>
                      <option value="Tahan">Tahan</option>
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Nomor Peserta Resmi (Auto / Custom):
                    </label>
                    <input
                      type="text"
                      value={noPesertaDraft}
                      onChange={(e) => setNoPesertaDraft(e.target.value)}
                      placeholder="Contoh: SMA-03 atau SMP-01"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Catatan Revisi / Instruksi untuk Peserta (Jika Perlu Perbaikan):
                  </label>
                  <textarea
                    rows={2}
                    value={catatanDraft}
                    onChange={(e) => setCatatanDraft(e.target.value)}
                    placeholder="Contoh: Surat tugas belum bertanda tangan kepala sekolah..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Info Notifikasi WhatsApp Pembina saat status Terverifikasi */}
                {statusDraft === 'Terverifikasi' && (
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-600/50 rounded-xl space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>Notifikasi WhatsApp Hasil Verifikasi & Cek E-Ticket Aktif</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-900 text-emerald-200 font-mono">
                            Otomatis
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-300/90 mt-0.5 leading-relaxed">
                          Nomor WhatsApp Pembina (<strong>{selectedReg.namaPembina} - {selectedReg.noWaPembina}</strong>) diaktifkan untuk mengirim pesan konfirmasi verifikasi resmi yang mencantumkan nama sekolah (<strong>{selectedReg.namaSekolah}</strong>), no. registrasi (<strong>{selectedReg.noRegistrasi}</strong>), dan petunjuk cek E-ticket di aplikasi.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div>
                {onDeleteRegistration && (
                  <button
                    type="button"
                    onClick={() => setPeletonToDelete(selectedReg)}
                    className="px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-400 hover:text-red-200 text-xs font-bold border border-red-800/60 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Data Peleton Ini</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Keputusan Verifikasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFIKASI SUKSES VERIFIKASI & KIRIM PESAN WA PEMBINA MODAL */}
      {verifiedPromptReg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-950 px-6 py-4 border-b border-emerald-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                    VERIFIKASI PANITIA SAH
                  </span>
                  <h4 className="text-sm font-bold text-white">Kirim Hasil Verifikasi ke WA Pembina</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifiedPromptReg(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-2 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">PANGKALAN SEKOLAH</div>
                    <div className="text-sm font-bold text-white">{verifiedPromptReg.namaSekolah}</div>
                    <div className="text-slate-400 text-[11px]">{verifiedPromptReg.namaPeleton} ({verifiedPromptReg.jenjang})</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] font-bold">
                    SAH / TERVERIFIKASI
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500">No. Registrasi:</span>
                    <div className="font-mono font-bold text-amber-400">{verifiedPromptReg.noRegistrasi}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Pembina:</span>
                    <div className="text-white font-medium">{verifiedPromptReg.namaPembina}</div>
                    <div className="font-mono text-emerald-400 text-[11px] font-bold">{verifiedPromptReg.noWaPembina}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl space-y-1.5 text-slate-300 text-[11px]">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Pesan Otomatis WhatsApp Siap Dikirim:</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Pemberitahuan bahwa status verifikasi telah dinyatakan <strong>Terverifikasi / Sah</strong> beserta nomor registrasi (<strong>{verifiedPromptReg.noRegistrasi}</strong>) dan arahan untuk mengecek serta mengunduh <strong>E-Ticket</strong> di aplikasi LKBB telah siap.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <a
                  href={getVerificationWhatsAppUrl(verifiedPromptReg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setVerifiedPromptReg(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan ke WA Pembina Sekarang</span>
                </a>
                <button
                  type="button"
                  onClick={() => setVerifiedPromptReg(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Tutup (Bisa Kirim Nanti dari Tabel)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PELUNASAN SUSULAN MODAL */}
      {pelunasanReg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase">KASIR SUSULAN</span>
                <h4 className="text-sm font-bold text-white">Catat Pelunasan Pembayaran</h4>
              </div>
              <button
                type="button"
                onClick={() => setPelunasanReg(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-white">{pelunasanReg.namaSekolah}</div>
              <div className="text-slate-400">Total Biaya: Rp {pelunasanReg.nominalHarusBayar.toLocaleString('id-ID')}</div>
              <div className="text-emerald-400">Telah Dibayar: Rp {pelunasanReg.nominalBayar.toLocaleString('id-ID')}</div>
              <div className="text-red-400 font-bold">Sisa Tagihan: Rp {pelunasanReg.sisaPembayaran.toLocaleString('id-ID')}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nominal Pembayaran Tambahan (Rp)
                </label>
                <input
                  type="number"
                  max={pelunasanReg.sisaPembayaran}
                  value={nominalTambahan}
                  onChange={(e) => setNominalTambahan(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Catatan / Keterangan Kwitansi
                </label>
                <input
                  type="text"
                  value={catatanPelunasan}
                  onChange={(e) => setCatatanPelunasan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPelunasanReg(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePelunasan}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Kwitansi Pelunasan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN IMAGE & DOCUMENT VIEWER */}
      {previewLightbox && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          {/* Lightbox Top Control Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{previewLightbox.title}</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {previewLightbox.fileName} · Resolusi Asli Penuh
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openDocumentInNewTab(previewLightbox.url, previewLightbox.fileName)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Buka berkas di tab baru browser secara aman"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </button>

              <button
                type="button"
                onClick={() => downloadDocumentFile(previewLightbox.url, previewLightbox.fileName)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors"
                title="Unduh berkas ke komputer / HP"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewLightbox(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                title="Tutup Pratinjau (Tekan ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Content Viewer */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            {previewLightbox.isPdf ? (
              <div className="w-full h-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <iframe
                  src={previewLightbox.url}
                  title={previewLightbox.title}
                  className="w-full flex-1 border-0"
                />
              </div>
            ) : (
              <div className="relative max-w-5xl max-h-[82vh] flex items-center justify-center">
                <img
                  src={previewLightbox.url}
                  alt={previewLightbox.title}
                  className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-slate-800 bg-slate-950/80"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_SURAT_TUGAS_PREVIEW;
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS PELETON (IN-APP MODAL, BEBAS DARI BLOKIR IFRAME) */}
      {peletonToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-bold uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>Konfirmasi Penghapusan Peleton</span>
              </div>
              <h3 className="text-xl font-black text-white">Hapus Data Peleton?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data peleton <strong className="text-white">{peletonToDelete.namaPeleton}</strong> dari{' '}
                <strong className="text-amber-400">{peletonToDelete.namaSekolah}</strong> ({peletonToDelete.noRegistrasi})?
              </p>
              <p className="text-[11px] text-red-400/90 font-mono">
                Data berkas pendaftaran ini akan dihapus permanen dari sistem.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPeletonToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRegistration) {
                    onDeleteRegistration(peletonToDelete.id);
                  }
                  if (selectedReg?.id === peletonToDelete.id) {
                    setSelectedReg(null);
                  }
                  setPeletonToDelete(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI KOSONGKAN SELURUH DATABASE */}
      {isConfirmingResetAll && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-bold uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>Tindakan Khusus Panitia</span>
              </div>
              <h3 className="text-xl font-black text-white">Kosongkan Seluruh Pendaftaran?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tindakan ini akan menghapus seluruh data (<strong className="text-white">{registrations.length} peleton</strong>) dari database lokal browser ini.
              </p>
              <p className="text-[11px] text-amber-400/90 font-mono">
                Sistem akan kembali bersih murni untuk menyambut data pendaftaran riil.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingResetAll(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetAllRegistrations?.();
                  setIsConfirmingResetAll(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
