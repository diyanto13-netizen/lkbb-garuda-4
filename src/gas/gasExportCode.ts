/**
 * Source code for Google Apps Script deployment (Kode.gs and Index.html)
 * Designed for Google Apps Script (HTML Service) + Google Sheets Database + Google Drive API
 */

export const KODE_GS_CONTENT = `/**
 * =========================================================================
 * APLIKASI WEB SISTEM REGISTRASI & MANAJEMEN LKBB GARUDA IV
 * SMKS PGRI 1 KOTA SUKABUMI
 * =========================================================================
 * Arsitektur: Google Apps Script Web App (Server-Side)
 * Database  : Google Sheets (Multi-Sheet Terstruktur)
 * Storage   : Google Drive (Folder Khusus: LKBB_GARUDA_IV_BERKAS)
 * Keamanan  : Server-side PIN Token (CacheService) & Concurrency Lock (LockService)
 * =========================================================================
 */

// Konfigurasi Default Sistem
var CONFIG = {
  DEFAULT_PIN: "1945", // PIN Panitia Default (Dapat diubah pada Pengaturan_Sistem)
  SESSION_TTL_SEC: 14400, // Durasi Sesi Admin 4 Jam
  DRIVE_FOLDER_NAME: "LKBB_GARUDA_IV_BERKAS",
  SHEET_KUOTA: "Master_Kuota",
  SHEET_PENDAFTARAN: "Tbl_Pendaftaran",
  SHEET_ANGGOTA: "Tbl_Anggota_Peleton",
  SHEET_PENGATURAN: "Pengaturan_Sistem"
};

/**
 * Endpoint Utama Web App
 */
function doGet(e) {
  initDatabase();
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('LKBB GARUDA IV - SMKS PGRI 1 Kota Sukabumi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inisialisasi Otomatis Sheet Database jika belum ada
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet Master_Kuota
  var sKuota = ss.getSheetByName(CONFIG.SHEET_KUOTA);
  if (!sKuota) {
    sKuota = ss.insertSheet(CONFIG.SHEET_KUOTA);
    sKuota.appendRow(['Jenjang', 'Kuota Maksimal', 'Biaya Pendaftaran', 'DP Minimal', 'Keterangan']);
    sKuota.getRange('A1:E1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sKuota.appendRow(['SD/MI', 20, 350000, 100000, '16 Pasukan + 1 Danton + 2 Official']);
    sKuota.appendRow(['SMP/MTs', 30, 450000, 100000, '16 Pasukan + 1 Danton + 2 Official']);
    sKuota.appendRow(['SMA/SMK/MA', 40, 500000, 100000, '16 Pasukan + 1 Danton + 2 Official']);
    sKuota.autoResizeColumns(1, 5);
  }

  // 2. Sheet Tbl_Pendaftaran
  var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
  if (!sReg) {
    sReg = ss.insertSheet(CONFIG.SHEET_PENDAFTARAN);
    sReg.appendRow([
      'ID Registrasi', 'No Registrasi', 'No Peserta', 'No Tampil', 'Jenjang', 
      'Nama Sekolah', 'NPSN', 'Nama Peleton', 'Kota Asal', 'Alamat', 
      'Nama Pembina', 'No WA Pembina', 'Nama Pelatih', 'No WA Pelatih', 'Email Resmi',
      'Metode Bayar', 'Nominal Bayar', 'Nominal Harus Bayar', 'Status Bayar', 'Sisa Bayar',
      'Link Bukti Bayar', 'Link Surat Tugas', 'Status Registrasi', 'Catatan Revisi',
      'Tanggal Pendaftaran', 'Tanggal Verifikasi'
    ]);
    sReg.getRange('A1:Z1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sReg.autoResizeColumns(1, 26);
  }

  // 3. Sheet Tbl_Anggota_Peleton
  var sAnggota = ss.getSheetByName(CONFIG.SHEET_ANGGOTA);
  if (!sAnggota) {
    sAnggota = ss.insertSheet(CONFIG.SHEET_ANGGOTA);
    sAnggota.appendRow(['ID Registrasi', 'No Registrasi', 'Nama Lengkap', 'NISN', 'Peran', 'Jenis Kelamin', 'Kelas / Jabatan']);
    sAnggota.getRange('A1:G1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sAnggota.autoResizeColumns(1, 7);
  }

  // 4. Sheet Pengaturan_Sistem
  var sSetting = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  if (!sSetting) {
    sSetting = ss.insertSheet(CONFIG.SHEET_PENGATURAN);
    sSetting.appendRow(['Kunci Konfigurasi', 'Nilai Konfigurasi', 'Keterangan']);
    sSetting.getRange('A1:C1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sSetting.appendRow(['ADMIN_PIN', '1945', 'PIN Akses Panitia']);
    sSetting.appendRow(['BANK_NAME', 'BANK BJB (Bank Jabar Banten)', 'Nama Bank']);
    sSetting.appendRow(['BANK_ACCOUNT', '0123-8899-7741-001', 'Nomor Rekening Resmi']);
    sSetting.appendRow(['BANK_HOLDER', 'PANITIA LKBB GARUDA IV SMKS PGRI 1 KOTA SUKABUMI', 'Nama Pemilik Rekening']);
    sSetting.appendRow(['BANK_NOTES', 'Berita transfer: LKBB4_[Nama Sekolah]. Simpan struk resmi.', 'Instruksi Transfer']);
    sSetting.autoResizeColumns(1, 3);
  }
}

/**
 * Dapatkan Folder Penyimpanan di Google Drive
 */
function getOrCreateUploadFolder() {
  var folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

/**
 * Simpan Berkas Base64 ke Google Drive
 */
function saveBase64ToDrive(base64Data, originalFileName, prefix) {
  if (!base64Data) return "";
  try {
    var folder = getOrCreateUploadFolder();
    var parts = base64Data.split(',');
    var encoded = parts.length > 1 ? parts[1] : parts[0];
    var mimeType = "application/octet-stream";
    if (parts.length > 1) {
      var mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) mimeType = mimeMatch[1];
    }
    var decoded = Utilities.base64Decode(encoded);
    var cleanName = (prefix || 'BERKAS') + '_' + (originalFileName || 'file.dat').replace(/[^a-zA-Z0-9._-]/g, '_');
    var blob = Utilities.newBlob(decoded, mimeType, cleanName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Gagal upload file: " + err.toString());
    return "";
  }
}

/**
 * Sanitasi Input String
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * =========================================================================
 * HANDLER PUBLIK (Tanpa Login)
 * =========================================================================
 */

/**
 * Ringkasan Kuota & Biaya Per Jenjang (Menggunakan CacheService)
 */
function getQuotaSummary() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("quota_summary_v1");
  if (cached) {
    return JSON.parse(cached);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sKuota = ss.getSheetByName(CONFIG.SHEET_KUOTA);
  var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);

  var kuotaData = sKuota.getRange(2, 1, sKuota.getLastRow() - 1, 5).getValues();
  var regData = sReg.getLastRow() > 1 ? sReg.getRange(2, 1, sReg.getLastRow() - 1, 26).getValues() : [];

  var counts = {
    'SD/MI': 0,
    'SMP/MTs': 0,
    'SMA/SMK/MA': 0
  };

  for (var i = 0; i < regData.length; i++) {
    var jnj = regData[i][4];
    var st = regData[i][22];
    // Hitung hanya yang sah/terverifikasi untuk kuota terisi riil
    if (st === 'Terverifikasi' && counts[jnj] !== undefined) {
      counts[jnj]++;
    }
  }

  var result = kuotaData.map(function(row) {
    var jenjang = row[0];
    return {
      jenjang: jenjang,
      kuotaMaks: Number(row[1]),
      terdaftarSah: counts[jenjang] || 0,
      sisaKuota: Math.max(0, Number(row[1]) - (counts[jenjang] || 0)),
      biayaPendaftaran: Number(row[2]),
      dpMinimal: Number(row[3]),
      keterangan: String(row[4])
    };
  });

  cache.put("quota_summary_v1", JSON.stringify(result), 120); // 2 Menit Cache
  return result;
}

/**
 * Konfigurasi Rekening Bank Panitia Publik
 */
function getPublicBankConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  var vals = s.getDataRange().getValues();
  var cfg = {};
  for (var i = 1; i < vals.length; i++) {
    cfg[vals[i][0]] = vals[i][1];
  }
  return {
    bankName: cfg['BANK_NAME'] || 'BANK BJB',
    nomorRekening: cfg['BANK_ACCOUNT'] || '0123-8899-7741-001',
    atasNama: cfg['BANK_HOLDER'] || 'PANITIA LKBB GARUDA IV',
    instruksi: cfg['BANK_NOTES'] || 'Harap sertakan berita transfer nama sekolah.'
  };
}

/**
 * Simpan Registrasi Baru (Dengan Proteksi LockService Konkurensi 50+ User)
 */
function saveNewRegistration(payload) {
  var lock = LockService.getScriptLock();
  try {
    // Tunggu antrean hingga 20 detik jika banyak pendaftar bersamaan
    lock.waitLock(20000);
  } catch (e) {
    return { success: false, message: "Lalu lintas sistem sedang tinggi. Mohon coba tekan tombol submit sekali lagi dalam beberapa detik." };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
    var sAnggota = ss.getSheetByName(CONFIG.SHEET_ANGGOTA);

    // Cek kuota jenjang terlebih dahulu
    var quotas = getQuotaSummary();
    var matchedQuota = quotas.find(function(q) { return q.jenjang === payload.jenjang; });
    if (matchedQuota && matchedQuota.sisaKuota <= 0) {
      return { success: false, message: "Mohon maaf, kuota peserta untuk jenjang " + payload.jenjang + " telah penuh." };
    }

    // Validasi Danton mutlak 1 orang
    var dantonCount = 0;
    if (payload.anggota && payload.anggota.length > 0) {
      for (var a = 0; a < payload.anggota.length; a++) {
        if (payload.anggota[a].peran === 'Danton') dantonCount++;
      }
    }
    if (dantonCount !== 1) {
      return { success: false, message: "Komposisi peleton wajib memiliki tepat 1 orang Komandan Peleton (Danton)." };
    }

    var regCount = sReg.getLastRow();
    var sequence = Utilities.formatString('%03d', regCount);
    var regId = 'REG-LKBB4-' + new Date().getFullYear() + '-' + sequence;
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    // Upload berkas ke Google Drive
    var buktiUrl = "";
    if (payload.buktiBayarBase64) {
      buktiUrl = saveBase64ToDrive(payload.buktiBayarBase64, payload.buktiBayarNama, 'BUKTI_' + sequence);
    }
    var suratUrl = "";
    if (payload.suratTugasBase64) {
      suratUrl = saveBase64ToDrive(payload.suratTugasBase64, payload.suratTugasNama, 'TUGAS_' + sequence);
    }

    var biayaMaks = matchedQuota ? matchedQuota.biayaPendaftaran : 500000;
    var nominalBayar = Number(payload.nominalBayar) || 0;
    var statusBayar = (nominalBayar >= biayaMaks) ? 'Lunas' : 'DP';
    var sisaBayar = Math.max(0, biayaMaks - nominalBayar);

    // Tulis ke Sheet Pendaftaran
    sReg.appendRow([
      regId,
      regId,
      "", // No Peserta belum terbit (diberi admin saat sah)
      "", // No Tampil belum diundi
      sanitizeString(payload.jenjang),
      sanitizeString(payload.namaSekolah),
      sanitizeString(payload.npsn),
      sanitizeString(payload.namaPeleton),
      sanitizeString(payload.kotaAsal),
      sanitizeString(payload.alamat),
      sanitizeString(payload.namaPembina),
      sanitizeString(payload.noWaPembina),
      sanitizeString(payload.namaPelatih),
      sanitizeString(payload.noWaPelatih),
      sanitizeString(payload.emailResmi),
      payload.metodePembayaran,
      nominalBayar,
      biayaMaks,
      statusBayar,
      sisaBayar,
      buktiUrl,
      suratUrl,
      'Menunggu Verifikasi',
      '',
      nowStr,
      ''
    ]);

    // Tulis Anggota ke Sheet Tbl_Anggota_Peleton
    if (payload.anggota && payload.anggota.length > 0) {
      var rowsAnggota = [];
      for (var k = 0; k < payload.anggota.length; k++) {
        var m = payload.anggota[k];
        rowsAnggota.push([
          regId,
          regId,
          sanitizeString(m.nama),
          sanitizeString(m.nisn),
          sanitizeString(m.peran),
          sanitizeString(m.jenisKelamin),
          sanitizeString(m.kelas)
        ]);
      }
      sAnggota.getRange(sAnggota.getLastRow() + 1, 1, rowsAnggota.length, 7).setValues(rowsAnggota);
    }

    // Bersihkan cache kuota agar terupdate
    CacheService.getScriptCache().remove("quota_summary_v1");

    return {
      success: true,
      noRegistrasi: regId,
      message: "Pendaftaran berhasil disimpan. Silakan simpan No. Registrasi Anda untuk pelacakan dan e-ticket."
    };
  } catch (error) {
    return { success: false, message: "Terjadi kesalahan internal: " + error.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pencarian Status Publik (Aman: Tanpa membocorkan nomor kontak pribadi)
 */
function searchPublicRegistration(keyword) {
  if (!keyword) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
  if (sReg.getLastRow() <= 1) return [];

  var data = sReg.getRange(2, 1, sReg.getLastRow() - 1, 26).getValues();
  var query = keyword.toString().toLowerCase().trim();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var regId = String(row[0]).toLowerCase();
    var sekolah = String(row[5]).toLowerCase();
    var peleton = String(row[7]).toLowerCase();

    if (regId.indexOf(query) !== -1 || sekolah.indexOf(query) !== -1 || peleton.indexOf(query) !== -1) {
      results.push({
        noRegistrasi: row[0],
        noPeserta: row[2] || "-",
        noTampil: row[3] || "-",
        jenjang: row[4],
        namaSekolah: row[5],
        namaPeleton: row[7],
        kotaAsal: row[8],
        metodeBayar: row[15],
        nominalBayar: Number(row[16]),
        sisaBayar: Number(row[19]),
        statusBayar: row[18],
        statusRegistrasi: row[22],
        catatanRevisi: row[23],
        tanggalDaftar: row[24]
      });
    }
  }

  return results;
}

/**
 * =========================================================================
 * HANDLER ADMIN & PANITIA (Terproteksi PIN & Sesi Token Server)
 * =========================================================================
 */

/**
 * Verifikasi PIN Panitia & Dapatkan Sesi Token Aman
 */
function verifyCommitteePin(pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sSetting = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  var vals = sSetting.getDataRange().getValues();
  var correctPin = CONFIG.DEFAULT_PIN;

  for (var i = 1; i < vals.length; i++) {
    if (vals[i][0] === 'ADMIN_PIN') {
      correctPin = String(vals[i][1]).trim();
      break;
    }
  }

  if (String(pin).trim() === correctPin) {
    var token = Utilities.getUuid();
    var cache = CacheService.getScriptCache();
    // Simpan token di cache server dengan TTL 4 jam
    cache.put("admin_token_" + token, "AUTHENTICATED", CONFIG.SESSION_TTL_SEC);
    return { success: true, token: token };
  }

  return { success: false, message: "PIN Panitia tidak cocok. Akses ditolak!" };
}

/**
 * Validasi Token Sesi Admin
 */
function isValidAdminSession(token) {
  if (!token) return false;
  var cache = CacheService.getScriptCache();
  var status = cache.get("admin_token_" + token);
  return status === "AUTHENTICATED";
}

/**
 * Dapatkan Seluruh Data Dashboard Admin (Finansial + Registrasi Lengkap)
 */
function getAdminDashboardData(token) {
  if (!isValidAdminSession(token)) {
    throw new Error("Sesi tidak valid atau telah kedaluwarsa. Silakan masukkan PIN kembali.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
  var sAnggota = ss.getSheetByName(CONFIG.SHEET_ANGGOTA);

  var regRows = sReg.getLastRow() > 1 ? sReg.getRange(2, 1, sReg.getLastRow() - 1, 26).getValues() : [];
  var anggotaRows = sAnggota.getLastRow() > 1 ? sAnggota.getRange(2, 1, sAnggota.getLastRow() - 1, 7).getValues() : [];

  // Grouping anggota by regId
  var anggotaMap = {};
  for (var a = 0; a < anggotaRows.length; a++) {
    var rId = anggotaRows[a][0];
    if (!anggotaMap[rId]) anggotaMap[rId] = [];
    anggotaMap[rId].push({
      nama: anggotaRows[a][2],
      nisn: anggotaRows[a][3],
      peran: anggotaRows[a][4],
      jenisKelamin: anggotaRows[a][5],
      kelas: anggotaRows[a][6]
    });
  }

  var registrations = [];
  var financialStats = {
    totalKasSah: 0,
    kasSD: 0,
    kasSMP: 0,
    kasSMA: 0,
    totalPiutangDP: 0,
    totalPendaftar: regRows.length,
    totalSah: 0
  };

  for (var i = 0; i < regRows.length; i++) {
    var r = regRows[i];
    var regObj = {
      rowNumber: i + 2,
      id: r[0],
      noRegistrasi: r[1],
      noPeserta: r[2],
      noTampil: r[3],
      jenjang: r[4],
      namaSekolah: r[5],
      npsn: r[6],
      namaPeleton: r[7],
      kotaAsal: r[8],
      alamat: r[9],
      namaPembina: r[10],
      noWaPembina: r[11],
      namaPelatih: r[12],
      noWaPelatih: r[13],
      emailResmi: r[14],
      metodePembayaran: r[15],
      nominalBayar: Number(r[16]),
      nominalHarusBayar: Number(r[17]),
      statusBayar: r[18],
      sisaBayar: Number(r[19]),
      buktiBayarUrl: r[20],
      suratTugasUrl: r[21],
      status: r[22],
      catatanRevisi: r[23],
      tanggalDaftar: r[24],
      tanggalVerifikasi: r[25],
      anggota: anggotaMap[r[0]] || []
    };

    registrations.push(regObj);

    // Hitung kas riil hanya dari peserta yang sah/terverifikasi
    if (regObj.status === 'Terverifikasi') {
      financialStats.totalKasSah += regObj.nominalBayar;
      if (regObj.jenjang === 'SD/MI') financialStats.kasSD += regObj.nominalBayar;
      if (regObj.jenjang === 'SMP/MTs') financialStats.kasSMP += regObj.nominalBayar;
      if (regObj.jenjang === 'SMA/SMK/MA') financialStats.kasSMA += regObj.nominalBayar;
      financialStats.totalSah++;
      if (regObj.sisaBayar > 0) {
        financialStats.totalPiutangDP += regObj.sisaBayar;
      }
    }
  }

  return {
    success: true,
    financialStats: financialStats,
    registrations: registrations
  };
}

/**
 * Update Status Pendaftaran & Terbitkan No Peserta (LockService Concurrency)
 */
function updateRegistrationStatus(token, regId, newStatus, catatanRevisi, customNoPeserta) {
  if (!isValidAdminSession(token)) throw new Error("Akses tidak diizinkan.");

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
    var data = sReg.getRange(2, 1, sReg.getLastRow() - 1, 26).getValues();

    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === regId) {
        var rowIdx = i + 2;
        var jenjang = data[i][4];
        var curNoPeserta = data[i][2];

        // Jika status diubah ke Terverifikasi dan belum punya No Peserta, buat otomatis
        if (newStatus === 'Terverifikasi' && !curNoPeserta) {
          var prefix = jenjang === 'SD/MI' ? 'SD' : jenjang === 'SMP/MTs' ? 'SMP' : 'SMA';
          var countJenjang = 1;
          for (var j = 0; j < data.length; j++) {
            if (data[j][4] === jenjang && data[j][2]) countJenjang++;
          }
          curNoPeserta = customNoPeserta || (prefix + '-' + Utilities.formatString('%02d', countJenjang));
          sReg.getRange(rowIdx, 3).setValue(curNoPeserta);
        }

        sReg.getRange(rowIdx, 23).setValue(newStatus);
        sReg.getRange(rowIdx, 24).setValue(catatanRevisi || '');
        sReg.getRange(rowIdx, 26).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
        
        CacheService.getScriptCache().remove("quota_summary_v1");
        return { success: true, message: "Status pendaftaran berhasil diperbarui." };
      }
    }

    return { success: false, message: "Data tidak ditemukan." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pembayaran Susulan (Pelunasan Peserta DP)
 */
function pelunasanPendaftaran(token, regId, nominalTambahan, catatan) {
  if (!isValidAdminSession(token)) throw new Error("Akses tidak diizinkan.");

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
    var data = sReg.getRange(2, 1, sReg.getLastRow() - 1, 26).getValues();

    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === regId) {
        var rowIdx = i + 2;
        var bayarLama = Number(data[i][16]);
        var harusBayar = Number(data[i][17]);
        var bayarBaru = bayarLama + Number(nominalTambahan);
        var sisaBaru = Math.max(0, harusBayar - bayarBaru);
        var statusBaru = (sisaBaru === 0) ? 'Lunas' : 'DP';

        sReg.getRange(rowIdx, 17).setValue(bayarBaru);
        sReg.getRange(rowIdx, 19).setValue(statusBaru);
        sReg.getRange(rowIdx, 20).setValue(sisaBaru);

        CacheService.getScriptCache().remove("quota_summary_v1");
        return { 
          success: true, 
          message: "Pelunasan susulan Rp " + nominalTambahan + " berhasil dicatat.",
          nominalBaru: bayarBaru,
          sisaBaru: sisaBaru
        };
      }
    }
    return { success: false, message: "Data pendaftaran tidak ditemukan." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Simpan Nomor Urut Tampil (Hasil Undian Lucky Wheel TM)
 */
function saveNomorTampil(token, regId, nomorTampil) {
  if (!isValidAdminSession(token)) throw new Error("Akses tidak diizinkan.");

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sReg = ss.getSheetByName(CONFIG.SHEET_PENDAFTARAN);
    var data = sReg.getRange(2, 1, sReg.getLastRow() - 1, 4).getValues();

    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === regId) {
        var rowIdx = i + 2;
        sReg.getRange(rowIdx, 4).setValue(Number(nomorTampil));
        return { success: true, message: "Nomor urut tampil " + nomorTampil + " berhasil disimpan." };
      }
    }
    return { success: false, message: "Data tidak ditemukan." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update Pengaturan Rekening Panitia
 */
function updateBankSettings(token, bankName, nomorRekening, atasNama, instruksi) {
  if (!isValidAdminSession(token)) throw new Error("Akses tidak diizinkan.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  var vals = s.getDataRange().getValues();

  for (var i = 1; i < vals.length; i++) {
    var key = vals[i][0];
    if (key === 'BANK_NAME') s.getRange(i + 1, 2).setValue(bankName);
    if (key === 'BANK_ACCOUNT') s.getRange(i + 1, 2).setValue(nomorRekening);
    if (key === 'BANK_HOLDER') s.getRange(i + 1, 2).setValue(atasNama);
    if (key === 'BANK_NOTES') s.getRange(i + 1, 2).setValue(instruksi);
  }
  return { success: true, message: "Rekening panitia berhasil diperbarui." };
}

/**
 * Update Pengaturan Master Kuota & Biaya Pendaftaran Per Jenjang
 */
function updateMasterKuota(token, kuotaList) {
  if (!isValidAdminSession(token)) throw new Error("Akses tidak diizinkan.");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(CONFIG.SHEET_KUOTA);
  if (!s) return { success: false, message: "Sheet Master_Kuota tidak ditemukan." };

  var data = s.getDataRange().getValues();
  for (var k = 0; k < kuotaList.length; k++) {
    var item = kuotaList[k];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === item.jenjang) {
        s.getRange(i + 1, 2).setValue(Number(item.kuotaMaks));
        s.getRange(i + 1, 3).setValue(Number(item.biayaPendaftaran));
        s.getRange(i + 1, 4).setValue(Number(item.dpMinimal));
        if (item.keterangan) s.getRange(i + 1, 5).setValue(item.keterangan);
      }
    }
  }

  CacheService.getScriptCache().remove("quota_summary_v1");
  return { success: true, message: "Master kuota dan biaya pendaftaran berhasil disimpan ke spreadsheet." };
}
`;

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LKBB GARUDA IV - SMKS PGRI 1 Kota Sukabumi</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; color: black !important; }
      .print-only { display: block !important; }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <!-- Header Bar -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-amber-500/20">
          G4
        </div>
        <div>
          <h1 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
            LKBB GARUDA IV <span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">SMKS PGRI 1 KOTA SUKABUMI</span>
          </h1>
          <p class="text-xs text-slate-400">Tingkat SD/MI, SMP/MTs, dan SMA/SMK/MA Se-Jawa Barat</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="switchTab('kuota')" class="nav-btn px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200">
          <i class="fa-solid fa-chart-pie mr-1 text-amber-400"></i> Kuota
        </button>
        <button onclick="switchTab('daftar')" class="nav-btn px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
          <i class="fa-solid fa-user-plus mr-1"></i> Daftar
        </button>
        <button onclick="switchTab('lacak')" class="nav-btn px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200">
          <i class="fa-solid fa-ticket mr-1 text-sky-400"></i> Lacak & Tiket
        </button>
        <button onclick="openPinModal()" class="nav-btn px-3 py-1.5 text-xs font-semibold rounded-md bg-red-950/80 border border-red-800/50 hover:bg-red-900 text-red-200">
          <i class="fa-solid fa-shield-halved mr-1 text-red-400"></i> Panitia
        </button>
      </div>
    </div>
  </header>

  <!-- Container App -->
  <main class="max-w-7xl mx-auto px-4 py-8" id="mainApp">
    <!-- Konten Tab Dinamis via Javascript -->
    <div id="tabContent"></div>
  </main>

  <script>
    // Inisialisasi awal saat load
    window.addEventListener('DOMContentLoaded', function() {
      switchTab('kuota');
    });

    function switchTab(tab) {
      const container = document.getElementById('tabContent');
      if (tab === 'kuota') {
        container.innerHTML = '<div class="text-center py-12"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-amber-400"></i><p class="mt-3 text-sm text-slate-400">Memuat kuota terkini dari Google Sheets...</p></div>';
        google.script.run
          .withSuccessHandler(renderKuota)
          .withFailureHandler(function(err) {
            container.innerHTML = '<div class="p-4 bg-red-950/40 border border-red-800 text-red-200 rounded">Gagal memuat: ' + err + '</div>';
          })
          .getQuotaSummary();
      }
    }

    function renderKuota(quotas) {
      let html = '<div class="space-y-6">';
      html += '<div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/60 shadow-xl">';
      html += '<h2 class="text-2xl font-black text-amber-400 tracking-wide">STATUS KUOTA RESMI LKBB GARUDA IV</h2>';
      html += '<p class="text-sm text-slate-300 mt-1">Kuota terdaftar di bawah diverifikasi langsung dari Google Sheets panitia.</p>';
      html += '</div>';

      html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">';
      quotas.forEach(function(q) {
        var pct = Math.round((q.terdaftarSah / q.kuotaMaks) * 100);
        html += '<div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">';
        html += '<div class="flex items-center justify-between">';
        html += '<span class="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">' + q.jenjang + '</span>';
        html += '<span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">Biaya: Rp ' + Number(q.biayaPendaftaran).toLocaleString('id-ID') + '</span>';
        html += '</div>';
        html += '<div class="mt-4"><div class="text-3xl font-extrabold text-white">' + q.terdaftarSah + ' <span class="text-sm text-slate-400 font-normal">/ ' + q.kuotaMaks + ' Peleton</span></div></div>';
        html += '<div class="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">';
        html += '<div class="bg-amber-500 h-2 rounded-full" style="width: ' + pct + '%"></div>';
        html += '</div>';
        html += '<div class="flex justify-between text-xs text-slate-400 mt-2">';
        html += '<span>Sisa Kuota: <b>' + q.sisaKuota + '</b></span>';
        html += '<span>Terisi: ' + pct + '%</span>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div></div>';
      document.getElementById('tabContent').innerHTML = html;
    }
  </script>
</body>
</html>
`;

export const DEPLOYMENT_GUIDE_CONTENT = `# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT (GAS)

Aplikasi Web ini dirancang khusus untuk berjalan langsung pada Google Apps Script (HTML Service) dengan Google Sheets sebagai basis data dan Google Drive untuk penyimpanan berkas otomatis.

---

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama Spreadsheet, misalnya: **LKBB_GARUDA_IV_DATABASE**.
3. Klik menu **Ekstensi (Extensions)** > **Apps Script**.

---

### Langkah 2: Salin Kode ke Google Apps Script
1. Di Script Editor, Anda akan melihat file default bernama **Kode.gs**.
2. Hapus seluruh isi default, lalu salin seluruh isi dari tab **Kode.gs** di aplikasi ini dan tempelkan.
3. Klik ikon **+** di sebelah kiri (Files), pilih **HTML**, lalu beri nama file: **Index** (sehingga menjadi **Index.html**).
4. Salin seluruh isi dari tab **Index.html** di aplikasi ini dan tempelkan ke dalam file **Index.html**.
5. Simpan proyek dengan menekan ikon Disket (**Save project** atau \`Ctrl + S\`).

---

### Langkah 3: Inisialisasi Database Pertama Kali
1. Di bilah atas Script Editor, pilih fungsi: **initDatabase**.
2. Klik tombol **Jalankan (Run)**.
3. Google akan meminta otorisasi izin pertama kali:
   - Klik **Review permissions**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced**, lalu klik **Go to Untitled project (unsafe)**.
   - Klik **Allow (Izinkan)**.
4. Kembali ke tab Spreadsheet Anda; 4 sheet otomatis terbentuk secara rapi:
   - \`Master_Kuota\`
   - \`Tbl_Pendaftaran\`
   - \`Tbl_Anggota_Peleton\`
   - \`Pengaturan_Sistem\` (PIN Panitia default: **1945**)

---

### Langkah 4: Terapkan Sebagai Aplikasi Web (Deploy as Web App)
1. Di Script Editor pojok kanan atas, klik tombol **Terapkan (Deploy)** > **Deployment baru (New deployment)**.
2. Klik ikon gerigi (Select type), pilih **Aplikasi web (Web app)**.
3. Konfigurasikan pengaturan:
   - **Deskripsi**: LKBB Garuda IV Web App v1.0
   - **Jalankan sebagai (Execute as)**: **Saya (diyanto13@gmail.com)**
   - **Siapa yang memiliki akses (Who has access)**: **Siapa saja (Anyone)**
4. Klik **Terapkan (Deploy)**.
5. Salin tautan **URL Aplikasi Web (Web app URL)**. Tautan tersebut adalah tautan publik resmi yang siap disebarkan ke peserta dan panitia!
`;
