import { KuotaJenjang, BankConfig, Sponsor, Pendaftaran } from '../types';

export const INITIAL_KUOTA: KuotaJenjang[] = [
  {
    jenjang: 'SD/MI',
    kuotaMaks: 20,
    biayaPendaftaran: 350000,
    dpMinimal: 100000,
    keterangan: '16 Pasukan + 1 Danton + 2 Official / Cadangan'
  },
  {
    jenjang: 'SMP/MTs',
    kuotaMaks: 30,
    biayaPendaftaran: 450000,
    dpMinimal: 100000,
    keterangan: '16 Pasukan + 1 Danton + 2 Official / Cadangan'
  },
  {
    jenjang: 'SMA/SMK/MA',
    kuotaMaks: 40,
    biayaPendaftaran: 500000,
    dpMinimal: 100000,
    keterangan: '16 Pasukan + 1 Danton + 2 Official / Cadangan'
  }
];

export const INITIAL_BANK: BankConfig = {
  bankName: 'BANK BJB (Bank Pembangunan Daerah Jawa Barat)',
  nomorRekening: '0123-8899-7741-001',
  atasNama: 'PANITIA LKBB GARUDA IV SMKS PGRI 1 KOTA SUKABUMI',
  instruksi: 'Harap cantumkan Berita Transfer: LKBB4_[Nama Sekolah] dan simpan bukti transfer untuk diunggah pada formulir pendaftaran.',
  kontakKonfirmasi: '0812-3456-7890 (Bendahara Pelaksana)'
};

/**
 * Data Sponsor & Mitra Resmi (Dimulai kosong, diinput panitia lewat Panel Panitia)
 */
export const INITIAL_SPONSORS: Sponsor[] = [];

/**
 * Data Pendaftaran Peleton (Dimulai kosong murni, diisi langsung dari input riil peserta dan database)
 */
export const INITIAL_PENDAFTARAN: Pendaftaran[] = [];
