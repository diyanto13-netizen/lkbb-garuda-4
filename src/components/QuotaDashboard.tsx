import React from 'react';
import { 
  Trophy, 
  Users, 
  CreditCard, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Award,
  MapPin
} from 'lucide-react';
import { KuotaJenjang, BankConfig, Sponsor, Pendaftaran } from '../types';
import { SponsorLogo } from './SponsorLogo';

interface QuotaDashboardProps {
  quotas: KuotaJenjang[];
  registrations: Pendaftaran[];
  bankConfig: BankConfig;
  sponsors: Sponsor[];
  onStartRegister: () => void;
  onOpenTracking: () => void;
}

export const QuotaDashboard: React.FC<QuotaDashboardProps> = ({
  quotas,
  registrations,
  bankConfig,
  sponsors,
  onStartRegister,
  onOpenTracking
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hitung kuota terisi sah
  const getFilledCount = (jenjang: string) => {
    return registrations.filter(
      r => r.jenjang === jenjang && (r.status === 'Terverifikasi' || r.status === 'Menunggu Verifikasi')
    ).length;
  };

  const totalRegistered = registrations.length;
  const totalVerified = registrations.filter(r => r.status === 'Terverifikasi').length;

  return (
    <div className="space-y-10">
      {/* Hero Banner with Paskibra aesthetic */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#101b35] via-[#0b1329] to-[#101b35] border border-amber-500/25 p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 mb-3 tracking-wider uppercase">
              <Award className="w-4 h-4" />
              <span>KOMPETISI BARIS BERBARIS RESMI SE-JAWA BARAT</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-heading">
              LKBB GARUDA IV <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
                SMKS PGRI 1 KOTA SUKABUMI
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              Ajang ketangkasan baris berbaris bergengsi antar satuan Paskibra Sekolah Tingkat SD/MI, SMP/MTs, dan SMA/SMK/MA Se-Jawa Barat. Kuota setiap mata lomba dibatasi ketat demi sportivitas penilaian.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onStartRegister}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <span>Daftarkan Peleton Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenTracking}
                className="px-6 py-3.5 rounded-xl bg-[#0f1931] hover:bg-[#152344] text-slate-200 border border-[#23355b] text-sm font-semibold transition-all shadow-md"
              >
                Cek Status & Unduh E-Ticket
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar: 6 Kotak Berwarna Berjajar Secara Horizontal (Desain Modern, Menarik & Profesional) */}
          <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {/* Kotak 1: Total Peleton Masuk */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-sky-500/20 hover:border-sky-400/50 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  Peleton Masuk
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Users className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight group-hover:text-sky-300 transition-colors">
                  {totalRegistered}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">Total Peleton Masuk</div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Database Riil</span>
                <span className="text-sky-400 font-semibold">Tercatat</span>
              </div>
            </div>

            {/* Kotak 2: Peleton Terverifikasi */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-950/25 via-slate-900/90 to-slate-950/95 border border-emerald-500/25 hover:border-emerald-400/60 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terverifikasi
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  {totalVerified}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">Peleton Sah & Valid</div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-emerald-400/80">
                <span>Siap Berlomba</span>
                <span className="font-bold text-emerald-300">100% Lolos</span>
              </div>
            </div>

            {/* Kotak 3: Formasi Pasukan + Danton */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-amber-950/25 via-slate-900/90 to-slate-950/95 border border-amber-500/25 hover:border-amber-400/60 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Formasi Lapangan
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Award className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  16 + 1
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">Pasukan + Danton</div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-amber-400/80">
                <span>Aturan Juknis</span>
                <span className="font-bold text-amber-300">Standar Resmi</span>
              </div>
            </div>

            {/* Kotak 4: Piala Tetap & Bergilir */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-cyan-950/25 via-slate-900/90 to-slate-950/95 border border-cyan-500/25 hover:border-cyan-400/60 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Gelar Juara
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-base sm:text-lg font-black text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                  Piala Tetap & Bergilir
                </div>
                <div className="text-xs sm:text-sm font-semibold text-cyan-200/90 mt-1">
                  Total Puluhan Tropi Juara
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-cyan-400/80">
                <span>Tingkat Jabar</span>
                <span className="font-bold text-cyan-300">Semua Jenjang</span>
              </div>
            </div>

            {/* Kotak 5: Tempat Pelaksanaan */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-rose-950/25 via-slate-900/90 to-slate-950/95 border border-rose-500/25 hover:border-rose-400/60 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  Tempat
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-base sm:text-lg font-black text-white tracking-tight leading-tight group-hover:text-rose-200 transition-colors">
                  SMKS PGRI 1
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono tracking-wider mt-1">
                  KOTA SUKABUMI
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-rose-400/80">
                <span>Gelanggang Utama</span>
                <span className="font-bold text-rose-300">Indoor/Outdoor</span>
              </div>
            </div>

            {/* Kotak 6: Waktu Pelaksanaan */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-950/25 via-slate-900/90 to-slate-950/95 border border-indigo-500/25 hover:border-indigo-400/60 p-4 sm:p-5 shadow-lg shadow-black/40 hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Waktu
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-base sm:text-lg font-black text-white font-mono tracking-tight leading-tight group-hover:text-indigo-200 transition-colors">
                  21-22 Nov 2026
                </div>
                <div className="text-xs sm:text-sm font-bold text-indigo-300/90 mt-1 font-mono">
                  Sabtu - Minggu
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-indigo-400/80">
                <span>Agenda Lomba</span>
                <span className="font-bold text-indigo-300">2 Hari Penuh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <span>Status Kuota Riil & Biaya Pendaftaran</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Data kuota otomatis terkunci saat mencapai kapasitas maksimal pendaftaran.
            </p>
          </div>
          <span className="text-xs sm:text-sm font-mono text-emerald-400 flex items-center gap-2 bg-emerald-950/70 px-3.5 py-1.5 rounded-xl border border-emerald-800/50 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Database
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotas.map((q) => {
            const filled = getFilledCount(q.jenjang);
            const remaining = Math.max(0, q.kuotaMaks - filled);
            const percentage = Math.min(100, Math.round((filled / q.kuotaMaks) * 100));
            const isFull = remaining === 0;

            return (
              <div
                key={q.jenjang}
                className={`relative rounded-3xl p-6 sm:p-7 transition-all duration-300 border ${
                  isFull 
                    ? 'bg-[#0e172e]/60 border-red-900/40 opacity-80' 
                    : 'bg-[#101b35] border-[#1e2d4d] hover:border-amber-500/50 shadow-xl hover:shadow-amber-500/5'
                }`}
              >
                {/* Header card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-amber-400 uppercase">
                      TINGKAT
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-white mt-0.5 font-heading">{q.jenjang}</h4>
                  </div>
                  {isFull ? (
                    <span className="text-xs font-bold text-red-400 bg-red-950/80 border border-red-800 px-2.5 py-1 rounded-lg uppercase">
                      Kuota Penuh
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg uppercase">
                      Tersedia
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                      {filled} <span className="text-xs sm:text-sm text-slate-400 font-normal">/ {q.kuotaMaks} Peleton</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-300">
                      Sisa {remaining} Peleton
                    </span>
                  </div>
                  <div className="w-full bg-[#0b1329] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#1e2d4d]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFull
                          ? 'bg-red-500'
                          : percentage > 75
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Pricing & Terms */}
                <div className="mt-6 pt-5 border-t border-[#1e2d4d] space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-slate-200">
                    <span className="font-medium">Biaya Pendaftaran</span>
                    <span className="font-mono font-black text-base sm:text-lg text-amber-400">
                      Rp {q.biayaPendaftaran.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Minimal Uang Muka (DP)</span>
                    <span className="font-mono font-bold text-slate-200">
                      Rp {q.dpMinimal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="pt-2 text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                    {q.keterangan}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={onStartRegister}
                    disabled={isFull}
                    className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isFull
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
                    }`}
                  >
                    {isFull ? 'Pendaftaran Ditutup' : 'Daftar Jenjang Ini'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Official Bank Account & Transfer Rules */}
      <section className="bg-[#101b35] border border-[#1e2d4d] rounded-3xl p-6 sm:p-9 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>REKENING PEMBAYARAN RESMI PANITIA</span>
            </div>
            <div>
              <h4 className="text-2xl sm:text-3xl font-black text-white font-heading">
                {bankConfig.bankName}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Atas Nama: <span className="font-bold text-white">{bankConfig.atasNama}</span>
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1329] border border-[#1e2d4d] max-w-xl shadow-inner">
              <div className="text-xs sm:text-sm text-slate-400 mb-1.5 font-medium">Nomor Rekening Resmi Panitia:</div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {bankConfig.nomorRekening}
                </span>
                <button
                  onClick={() => copyToClipboard(bankConfig.nomorRekening)}
                  className="px-4 py-2 rounded-xl bg-[#142347] hover:bg-[#1a2d59] text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all self-start sm:self-auto border border-[#233868]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Salin Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
              <span className="font-bold text-amber-400">Instruksi Pembayaran: </span>
              {bankConfig.instruksi}
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-[#0b1329] border border-[#1e2d4d] rounded-2xl p-6 sm:p-7 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white font-heading">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Verifikasi Berkas & Transaksi</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold text-base">•</span>
                <span>Uang Muka (DP) minimal <b>Rp 100.000</b> untuk mengunci nomor antrean kuota.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold text-base">•</span>
                <span>Wajib mengunggah bukti transfer pembayaran yang valid (struk ATM / m-banking / teller).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold text-base">•</span>
                <span>Nomor Tampil akan diundi secara transparan pada Technical Meeting via modul Lucky Wheel.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Official Sponsors & Partners Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
            Sponsor & Mitra Resmi LKBB Garuda IV
          </h4>
          <span className="text-xs text-slate-400">Didukung oleh berbagai instansi & brand terkemuka</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sponsors.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              Belum ada logo sponsor yang ditambahkan. Panitia dapat mengelola sponsor melalui Panel Panitia.
            </div>
          ) : (
            sponsors.map((sp) => (
              <div
                key={sp.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center group hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="mb-3 group-hover:scale-105 transition-transform">
                  <SponsorLogo
                    src={sp.logoUrl}
                    alt={sp.nama}
                    containerClassName="w-20 h-20 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-md overflow-hidden border border-slate-200"
                  />
                </div>
                <span className="text-xs font-bold text-slate-200 line-clamp-1">{sp.nama}</span>
                <span className="text-[10px] text-amber-400/90 uppercase font-mono mt-1 font-semibold">{sp.tipe}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
