export type Jenjang = 'SD/MI' | 'SMP/MTs' | 'SMA/SMK/MA';

export type StatusPendaftaran = 
  | 'Terverifikasi' 
  | 'Perlu Perbaikan' 
  | 'Ditolak' 
  | 'Tahan' 
  | 'Menunggu Verifikasi';

export type MetodePembayaran = 'LUNAS' | 'DP';

export type PeranAnggota = 'Danton' | 'Pasukan' | 'Official';

export interface AnggotaPeleton {
  id: string;
  nama: string;
  nisn: string;
  peran: PeranAnggota;
  jenisKelamin: 'L' | 'P';
  kelas: string;
  fotoUrl?: string;
}

export interface RiwayatPelunasan {
  id: string;
  tanggal: string;
  nominal: number;
  catatan: string;
  buktiUrl?: string;
}

export interface Pendaftaran {
  id: string;
  noRegistrasi: string;
  noPeserta?: string;
  noTampil?: number | null;
  jenjang: Jenjang;
  namaSekolah: string;
  npsn?: string;
  namaPeleton: string;
  kotaAsal: string;
  alamat: string;
  namaPembina: string;
  noWaPembina: string;
  namaPelatih: string;
  noWaPelatih: string;
  emailResmi?: string;
  anggota: AnggotaPeleton[];
  metodePembayaran: MetodePembayaran;
  nominalBayar: number;
  nominalHarusBayar: number;
  statusPembayaran: 'Lunas' | 'DP';
  sisaPembayaran: number;
  buktiBayarUrl: string;
  buktiBayarNama?: string;
  suratTugasUrl?: string;
  suratTugasNama?: string;
  status: StatusPendaftaran;
  catatanRevisi?: string;
  tanggalDaftar: string;
  tanggalVerifikasi?: string;
  riwayatPelunasan?: RiwayatPelunasan[];
}

export interface KuotaJenjang {
  jenjang: Jenjang;
  kuotaMaks: number;
  biayaPendaftaran: number;
  dpMinimal: number;
  keterangan: string;
}

export interface BankConfig {
  bankName: string;
  nomorRekening: string;
  atasNama: string;
  instruksi: string;
  kontakKonfirmasi: string;
}

export interface Sponsor {
  id: string;
  nama: string;
  logoUrl: string;
  tipe: 'Utama' | 'Pendukung' | 'Media Partner';
}

export interface AdminSession {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: number | null;
}
