import { Pendaftaran } from '../types';

/**
 * Format nomor telepon Indonesia menjadi format internasional WhatsApp (62xxx)
 */
export const formatWhatsAppNumber = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Membuat template pesan WhatsApp resmi hasil verifikasi dari panitia
 * Berisi:
 * - Nama Sekolah
 * - No. Registrasi
 * - Status Terverifikasi / Sah oleh panitia
 * - Instruksi untuk cek dan unduh E-Ticket di aplikasi LKBB
 */
export const createVerificationWhatsAppMessage = (reg: Pendaftaran): string => {
  const noPesertaText = reg.noPeserta ? `\n* No. Peserta Resmi: ${reg.noPeserta}` : '';
  const noTampilText = reg.noTampil ? `\n* No. Urut Tampil (TM): #${reg.noTampil}` : '';
  const sisaBiayaText = reg.sisaPembayaran > 0 
    ? `\n* Sisa Biaya (DP): Rp ${reg.sisaPembayaran.toLocaleString('id-ID')} (dapat dilunasi sebelum/saat TM)` 
    : `\n* Status Pembayaran: LUNAS (Rp ${reg.nominalBayar.toLocaleString('id-ID')})`;

  return `*PEMBERITAHUAN HASIL VERIFIKASI RESMI PANITIA LKBB GARUDA IV SMKS PGRI 1 SUKABUMI* 🎖️✅\n\n` +
    `Halo Bapak/Ibu Pembina *${reg.namaPembina}*,\n` +
    `Salam hormat dari Panitia Pelaksana LKBB.\n\n` +
    `Kabar gembira! Berkas administrasi pendaftaran peleton dari sekolah Anda telah diperiksa dan dinyatakan:\n` +
    `👉 *STATUS: TERVERIFIKASI / SAH* 👈\n\n` +
    `📋 *RINCIAN PENDAFTARAN RESMI:*\n` +
    `* Pangkalan Sekolah: ${reg.namaSekolah}\n` +
    `* No. Registrasi: ${reg.noRegistrasi}\n` +
    `* Nama Peleton: ${reg.namaPeleton}\n` +
    `* Jenjang: ${reg.jenjang}` +
    noPesertaText +
    noTampilText +
    sisaBiayaText + `\n\n` +
    `🎟️ *PEMBERITAHUAN CEK & CETAK E-TICKET:* \n` +
    `E-Ticket resmi peleton Anda kini telah AKTIF di sistem aplikasi LKBB.\n` +
    `Mohon segera akses aplikasi dan lakukan langkah berikut:\n` +
    `1. Masuk ke menu "Lacak & E-Ticket" pada aplikasi LKBB.\n` +
    `2. Masukkan No. Registrasi (${reg.noRegistrasi}) atau No. WhatsApp Anda (${reg.noWaPembina}).\n` +
    `3. Klik "Cek Status / Unduh E-Ticket" untuk melihat tiket digital resmi ber-QR Code.\n` +
    `4. Simpan atau cetak E-Ticket tersebut sebagai bukti sah untuk registrasi ulang saat TM (Technical Meeting).\n\n` +
    `Bila ada pertanyaan mengenai teknis perlombaan atau jadwal TM, silakan berkoordinasi langsung dengan panitia.\n\n` +
    `Terima kasih atas partisipasinya dan selamat mempersiapkan pasukan terbaik Anda! 🇮🇩✨\n\n` +
    `Panitia Pelaksana LKBB GARUDA IV SMKS PGRI 1 SUKABUMI`;
};

/**
 * Menghasilkan link tautan WhatsApp API
 */
export const getVerificationWhatsAppUrl = (reg: Pendaftaran): string => {
  const phone = formatWhatsAppNumber(reg.noWaPembina);
  const text = encodeURIComponent(createVerificationWhatsAppMessage(reg));
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
};
