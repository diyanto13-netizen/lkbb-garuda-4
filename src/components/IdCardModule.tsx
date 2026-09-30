import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  Filter, 
  Building, 
  User, 
  ShieldCheck, 
  QrCode,
  Download,
  Layers,
  Sparkles
} from 'lucide-react';
import { Pendaftaran, AnggotaPeleton, PeranAnggota } from '../types';

interface IdCardModuleProps {
  registrations: Pendaftaran[];
}

export const IdCardModule: React.FC<IdCardModuleProps> = ({ registrations }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    registrations.length > 0 ? registrations[0].id : ''
  );
  const [roleFilter, setRoleFilter] = useState<'All' | PeranAnggota>('All');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Auto-sync selected team if registrations change
  React.useEffect(() => {
    if (registrations.length > 0 && (!selectedTeamId || !registrations.some(r => r.id === selectedTeamId))) {
      setSelectedTeamId(registrations[0].id);
    }
  }, [registrations, selectedTeamId]);

  const currentTeam = registrations.find((r) => r.id === selectedTeamId);

  // Filter members of current team
  const filteredMembers = currentTeam
    ? currentTeam.anggota.filter((m) => {
        if (roleFilter === 'All') return true;
        return m.peran === roleFilter;
      })
    : [];

  // Card to display if single print selected
  const singleMember = currentTeam?.anggota.find((m) => m.id === selectedMemberId);

  const handlePrint = (singleId?: string) => {
    if (singleId) {
      setSelectedMemberId(singleId);
    } else {
      setSelectedMemberId(null);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getRoleColor = (peran: PeranAnggota) => {
    switch (peran) {
      case 'Danton':
        return {
          bg: 'bg-amber-500',
          text: 'text-slate-950',
          border: 'border-amber-400',
          label: 'KOMANDAN PELETON'
        };
      case 'Official':
        return {
          bg: 'bg-red-700',
          text: 'text-white',
          border: 'border-red-600',
          label: 'OFFICIAL / PEMBINA'
        };
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-amber-400',
          border: 'border-slate-700',
          label: 'PASUKAN INTI'
        };
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 no-print">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            ATRIBUT & AKREDITASI RESMI
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-amber-400" />
            <span>Modul Cetak ID Card Peserta (Format Vertikal)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Format vertikal standar lencana Paskibra dengan penonjolan nomor tampil ukuran besar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={!currentTeam || filteredMembers.length === 0}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Massal Satu Peleton ({filteredMembers.length} Kartu)</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Team Selector & Role Filters */}
      <div className="no-print bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Team Selector */}
        <div className="flex-1 max-w-md space-y-1">
          <label className="block text-xs font-semibold text-slate-400">Pilih Pangkalan Peleton:</label>
          <select
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setSelectedMemberId(null);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {registrations.length === 0 ? (
              <option value="">Belum ada data peleton terdaftar</option>
            ) : (
              registrations.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.jenjang}] {r.namaSekolah} - {r.namaPeleton} (No. Tampil: {r.noTampil || 'N/A'})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Role Filters */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400">Filter Kategori Kartu:</label>
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {(['All', 'Danton', 'Pasukan', 'Official'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRoleFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  roleFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'All' ? 'Semua Kartu' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Team Info Banner */}
      {currentTeam && (
        <div className="no-print p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black font-mono">
              G4
            </div>
            <div>
              <div className="text-white font-bold text-sm">{currentTeam.namaSekolah}</div>
              <div className="text-slate-400">
                Peleton: <b className="text-slate-200">{currentTeam.namaPeleton}</b> · Jenjang:{' '}
                <b className="text-slate-200">{currentTeam.jenjang}</b>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">No. Tampil (TM): </span>
              <span className="font-mono font-black text-amber-400 text-base ml-1">
                {currentTeam.noTampil ? `#${currentTeam.noTampil}` : 'BELUM DIUNDI'}
              </span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-slate-300">
              Total Kartu: <b className="text-white">{filteredMembers.length}</b>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid Preview & Print Container */}
      <div className="print-area">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs no-print">
            Tidak ada anggota dalam kategori peran ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(selectedMemberId ? filteredMembers.filter(m => m.id === selectedMemberId) : filteredMembers).map((member) => {
              const roleStyle = getRoleColor(member.peran);
              return (
                <div
                  key={member.id}
                  className="page-break-inside-avoid relative w-full max-w-[270px] mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden border-2 border-slate-900 shadow-2xl flex flex-col justify-between"
                  style={{ minHeight: '410px' }}
                >
                  {/* Top Header Card Lanyard Clip Notch */}
                  <div className="bg-white text-slate-950 p-2.5 text-center relative border-b-2 border-slate-900">
                    {/* Hole punch indicator */}
                    <div className="w-8 h-2 bg-slate-200 rounded-full mx-auto mb-1.5 border border-slate-400"></div>

                    <div className="text-[9px] font-mono tracking-widest text-black uppercase font-black">
                      SMKS PGRI 1 KOTA SUKABUMI
                    </div>
                    <div className="text-xs font-black tracking-tight text-black uppercase mt-0.5">
                      LKBB GARUDA IV · 2026
                    </div>
                    <div className="text-[8px] font-bold text-black tracking-wider mt-0.5">
                      TINGKAT SE-JAWA BARAT
                    </div>
                  </div>

                  {/* High Visibility Performance Number Header (Diperbesar Khusus Agar Jelas Terlihat oleh Juri) */}
                  <div className="bg-amber-400 text-slate-950 py-2 px-3.5 flex items-center justify-between border-b-2 border-slate-900 shadow-sm">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-mono font-black tracking-wider uppercase leading-none text-black">
                        NO. TAMPIL:
                      </span>
                      <span className="text-[7.5px] font-mono font-black tracking-tight text-black uppercase mt-1">
                        PENILAIAN JURI
                      </span>
                    </div>
                    <div className="flex items-center justify-center bg-white text-black font-mono font-black text-5xl sm:text-6xl px-4 py-1.5 rounded-xl border-2 border-slate-900 min-w-[76px] text-center leading-none shadow-sm">
                      {currentTeam?.noTampil ? currentTeam.noTampil : '-'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col items-center text-center justify-center space-y-2">
                    {/* Avatar / Photo Box */}
                    <div className="w-20 h-24 rounded-lg bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      <User className="w-10 h-10 text-slate-400" />
                      <span className="text-[7px] font-mono text-slate-500 mt-1 uppercase">FOTO 3X4</span>
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] text-white py-0.5 font-mono">
                        {member.jenisKelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                      </div>
                    </div>

                    {/* Member Name */}
                    <div className="w-full">
                      <h4 className="text-sm font-black text-slate-950 line-clamp-1 leading-tight">
                        {member.nama}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        NISN: {member.nisn}
                      </p>
                    </div>

                    {/* School & Peleton */}
                    <div className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px]">
                      <div className="font-bold text-slate-900 line-clamp-1">{currentTeam?.namaSekolah}</div>
                      <div className="text-slate-600 line-clamp-1">{currentTeam?.namaPeleton}</div>
                    </div>
                  </div>

                  {/* Role Badge Banner */}
                  <div className={`${roleStyle.bg} ${roleStyle.text} py-2 text-center border-t-2 border-slate-900`}>
                    <div className="text-xs font-black font-mono tracking-widest uppercase">
                      {roleStyle.label}
                    </div>
                  </div>

                  {/* Bottom Footer Bar with Barcode */}
                  <div className="bg-white text-black p-2.5 text-center flex items-center justify-between text-[8px] font-mono border-t-2 border-slate-900">
                    <div className="text-left">
                      <div className="text-[7px] text-slate-700 uppercase font-bold">AKREDITASI</div>
                      <div className="text-black font-black">{currentTeam?.jenjang}</div>
                    </div>

                    {/* Faux Barcode lines */}
                    <div className="flex items-center gap-0.5 h-5 bg-white p-1 rounded border border-slate-300">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2].map((w, i) => (
                        <div key={i} className="bg-black h-full" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>

                    <div className="text-right">
                      <div className="text-[7px] text-slate-700 uppercase font-bold">ID REG</div>
                      <div className="text-black font-bold font-mono">{currentTeam?.noRegistrasi ? currentTeam.noRegistrasi.slice(-4) : '-'}</div>
                    </div>
                  </div>

                  {/* Floating Action Button (No Print) */}
                  <div className="no-print absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handlePrint(member.id)}
                      title="Cetak Kartu Ini Saja"
                      className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-950 text-white border border-slate-700 shadow"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
