import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Ticket, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building, 
  QrCode, 
  Download,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { Pendaftaran } from '../types';
import QRCode from 'qrcode';

interface TrackingAndETicketProps {
  registrations: Pendaftaran[];
  initialSearchQuery?: string;
}

export const TrackingAndETicket: React.FC<TrackingAndETicketProps> = ({
  registrations,
  initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedTicket, setSelectedTicket] = useState<Pendaftaran | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const openTicketModal = async (item: Pendaftaran) => {
    setSelectedTicket(item);
    try {
      // Hasilkan link URL verifikasi resmi aplikasi
      // Saat di-scan dengan kamera HP / Google Lens / Barcode scanner, HP akan langsung membuka link verifikasi ini
      const baseUrl = window.location.origin + window.location.pathname;
      const verificationUrl = `${baseUrl}?tab=tracking&reg=${encodeURIComponent(item.noRegistrasi)}`;

      const url = await QRCode.toDataURL(verificationUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0c1a30',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(url);
    } catch {
      // fallback
    }
  };

  // Filter registrations based on query (by No Registrasi, Nama Sekolah, Nama Peleton, No Peserta, or No WhatsApp)
  const filtered = registrations.filter((r) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/\D/g, '');
    const phoneMatch = cleanQ.length >= 4 && (
      (r.noWaPembina && r.noWaPembina.replace(/\D/g, '').includes(cleanQ)) ||
      (r.noWaPelatih && r.noWaPelatih.replace(/\D/g, '').includes(cleanQ))
    );
    return (
      r.noRegistrasi.toLowerCase().includes(q) ||
      r.namaSekolah.toLowerCase().includes(q) ||
      r.namaPeleton.toLowerCase().includes(q) ||
      (r.noPeserta && r.noPeserta.toLowerCase().includes(q)) ||
      phoneMatch
    );
  });

  // Auto-buka tiket jika ada parameter query dari scan QR code
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      const matched = registrations.find(
        r => r.noRegistrasi.toLowerCase() === initialSearchQuery.toLowerCase()
      );
      if (matched) {
        openTicketModal(matched);
      }
    }
  }, [initialSearchQuery, registrations]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Pendaftaran['status']) => {
    switch (status) {
      case 'Terverifikasi':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terverifikasi / Sah</span>
          </span>
        );
      case 'Perlu Perbaikan':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/80 px-2.5 py-1 rounded-md">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 no-print">
        <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
          PORTAL PELACAKAN & E-TICKET
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Lacak Status Registrasi & Unduh Tiket Resmi
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Cari berdasarkan No. Registrasi atau Nama Sekolah Anda. Data nomor kontak peserta disembunyikan untuk menjaga privasi.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="no-print bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik No. Registrasi, No. WhatsApp Pembina, atau Nama Sekolah..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Helpful Search Tip */}
        <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
          <span>Tip: Masukkan No. Registrasi, Nama Sekolah, atau No. WhatsApp yang terdaftar pada formulir pendaftaran.</span>
        </div>
      </div>

      {/* Search Results */}
      <div className="no-print space-y-4">
        {searchQuery.trim() !== '' && filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">Data Tidak Ditemukan</h4>
            <p className="text-xs text-slate-400">
              Tidak ada peleton dengan kata kunci &quot;{searchQuery}&quot;. Pastikan nomor registrasi atau ejaan nama sekolah sudah benar.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                    {item.noRegistrasi}
                  </span>
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {item.jenjang}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{item.namaSekolah}</span>
                  </h4>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Peleton: <b className="text-slate-200">{item.namaPeleton}</b></span>
                    <span>Asal: <b className="text-slate-200">{item.kotaAsal}</b></span>
                    <span>Daftar: <b className="text-slate-200">{item.tanggalDaftar}</b></span>
                  </div>
                </div>

                {/* Performance Number & Participants Badge */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">No. Peserta: </span>
                    <b className="font-mono text-white">{item.noPeserta || 'Belum Terbit'}</b>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">No. Urut Tampil (TM): </span>
                    <b className="font-mono text-amber-400 text-sm">
                      {item.noTampil ? `NOMOR ${item.noTampil}` : 'Belum Diundi'}
                    </b>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Status Bayar: </span>
                    <b className={item.statusPembayaran === 'Lunas' ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.statusPembayaran} (Rp {item.nominalBayar.toLocaleString('id-ID')})
                    </b>
                  </div>
                </div>

                {/* Revision Note Banner if Perlu Perbaikan */}
                {item.status === 'Perlu Perbaikan' && item.catatanRevisi && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Catatan Revisi dari Panitia:</span>
                    </div>
                    <p className="text-slate-300 pl-5">{item.catatanRevisi}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 shrink-0 justify-center">
                <button
                  type="button"
                  onClick={() => openTicketModal(item)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Lihat & Cetak E-Ticket</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL E-TICKET RESMI (PRINT READY) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-white print:backdrop-none print:overflow-visible">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative print:bg-white print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:p-0 print:m-0">
            {/* Top Modal Controls (No Print) */}
            <div className="no-print bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                <Ticket className="w-4 h-4" />
                <span>E-TICKET RESMI LKBB GARUDA IV</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* E-Ticket Card Layout (This gets printed) */}
            <div className="print-area p-8 bg-white text-slate-900 print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white">
              {/* Kop Surat LKBB */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-red-700">
                    PANITIA PELAKSANA LOMBA KETANGKASAN BARIS BERBARIS
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">
                    LKBB GARUDA IV - SMKS PGRI 1 KOTA SUKABUMI
                  </h3>
                  <p className="text-xs text-slate-600">
                    Jl. Pelabuhan II Perum Cipoho Indah, Cikondang, Kec. Citamiang, Kota Sukabumi, Jawa Barat 43141 · Telp: (0266) 224277
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 text-amber-400 flex flex-col items-center justify-center font-black print:bg-white print:border-2 print:border-slate-900 print:text-slate-950">
                    <span className="text-lg leading-none">G4</span>
                    <span className="text-[8px] tracking-widest uppercase">PASKIBRA</span>
                  </div>
                </div>
              </div>

              {/* Title Ribbon */}
              <div className="bg-slate-950 text-white my-4 py-2 px-4 rounded-lg flex items-center justify-between print:bg-transparent print:border-y-2 print:border-slate-900 print:rounded-none print:px-1 print:py-1.5 print:my-3">
                <span className="text-xs font-bold font-mono tracking-widest text-amber-400 uppercase print:text-slate-950 print:font-black">
                  BUKTI REGISTRASI & E-TICKET RESMI PESERTA
                </span>
                <span className="text-xs font-mono font-bold print:text-slate-950">{selectedTicket.jenjang}</span>
              </div>

              {/* Two Column Ticket Content */}
              <div className="grid grid-cols-3 gap-6 items-start py-2">
                <div className="col-span-2 space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase">Pangkalan Sekolah</span>
                    <div className="text-lg font-black text-slate-950">{selectedTicket.namaSekolah}</div>
                    <div className="text-slate-600 text-xs">
                      {selectedTicket.npsn ? `NPSN: ${selectedTicket.npsn} · ` : ''}{selectedTicket.kotaAsal}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">Nama Peleton</span>
                      <div className="font-bold text-slate-900 text-sm">{selectedTicket.namaPeleton}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">No. Registrasi</span>
                      <div className="font-mono font-bold text-slate-900 text-sm">{selectedTicket.noRegistrasi}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">Nomor Peserta</span>
                      <div className="text-base font-black font-mono text-red-700">
                        {selectedTicket.noPeserta || 'Belum Terbit (Pending)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">No. Urut Tampil (TM)</span>
                      <div className="text-xl font-black font-mono text-amber-600 print:text-slate-950">
                        {selectedTicket.noTampil ? `NOMOR ${selectedTicket.noTampil}` : 'BELUM DIUNDI'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between">
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">Status Bayar:</span>
                      <span className="font-bold ml-1 text-slate-900">
                        {selectedTicket.statusPembayaran} (Rp {selectedTicket.nominalBayar.toLocaleString('id-ID')})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono text-[10px] uppercase">Total Anggota:</span>
                      <span className="font-bold ml-1 text-slate-900">{selectedTicket.anggota.length} Orang</span>
                    </div>
                  </div>
                </div>

                {/* Right QR Box */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center print:bg-white print:border-slate-400">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code E-Ticket" className="w-36 h-36 mx-auto rounded" />
                  ) : (
                    <QrCode className="w-32 h-32 text-slate-400" />
                  )}
                  <span className="text-[9px] font-mono text-slate-500 mt-2 block print:text-slate-700">
                    OTENTIKASI DIGITAL
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 mt-0.5 print:text-black">
                    {selectedTicket.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Roster Summary */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600">
                <div className="font-bold text-slate-800 uppercase font-mono mb-1">
                  Komandan Peleton (Danton) & Official:
                </div>
                <div className="flex flex-wrap gap-x-4">
                  <span>Danton: <b>{selectedTicket.anggota.find(a => a.peran === 'Danton')?.nama || '-'}</b></span>
                  <span>Pembina: <b>{selectedTicket.namaPembina}</b></span>
                  <span>Pelatih: <b>{selectedTicket.namaPelatih}</b></span>
                </div>
              </div>

              {/* Official Stamp & Terms */}
              <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-[10px] text-slate-600 items-end">
                <div className="col-span-2 space-y-1">
                  <div className="font-bold text-slate-900">Ketentuan Resmi:</div>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Wajib membawa cetakan e-ticket ini saat daftar ulang Technical Meeting.</li>
                    <li>Nomor urut tampil berlaku mutlak sesuai hasil pengundian resmi.</li>
                    <li>Sisa pembayaran DP wajib dilunasi sebelum jadwal tampil peleton.</li>
                  </ol>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500">Kota Sukabumi, {new Date().toLocaleDateString('id-ID')}</div>
                  <div className="text-xs font-bold text-slate-950 mt-1">Panitia Pelaksana LKBB Garuda IV</div>
                  <div className="h-10"></div>
                  <div className="font-bold underline text-slate-900">SEKRETARIAT PANITIA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
