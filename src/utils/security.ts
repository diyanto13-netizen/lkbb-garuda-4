/**
 * Security & Cryptography Utilities
 * Standar enkripsi satu arah SHA-256 menggunakan Web Crypto API resmi bawaan browser.
 * Ringan, cepat (0.001s), dan kompatibel 100% di semua browser modern tanpa library pihak ketiga.
 */

/**
 * Menghasilkan hash heksadesimal 64 karakter dari string teks menggunakan SHA-256.
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cek apakah string merupakan representasi heksadesimal SHA-256 (panjang tepat 64 char)
 */
export function isSha256Hash(value: string): boolean {
  if (!value) return false;
  return /^[a-f0-9]{64}$/i.test(value.trim());
}

/**
 * Hash satu arah untuk PIN panitia sebelum disimpan ke database / localStorage.
 */
export async function hashPin(plainPin: string): Promise<string> {
  return await sha256(plainPin.trim());
}

/**
 * Memverifikasi input PIN terhadap nilai tersimpan di sistem.
 * Mendukung auto-compatibility (bekerja baik untuk hash SHA-256 maupun PIN teks biasa lama).
 */
export async function verifyPin(inputPin: string, storedPinOrHash: string): Promise<boolean> {
  const cleanInput = (inputPin || '').trim();
  const cleanStored = (storedPinOrHash || '').trim();

  if (!cleanInput || !cleanStored) return false;

  // Jika tersimpan dalam format hash SHA-256 (64 hex characters)
  if (isSha256Hash(cleanStored)) {
    const inputHash = await sha256(cleanInput);
    return inputHash.toLowerCase() === cleanStored.toLowerCase();
  }

  // Fallback kompatibilitas jika tersimpan masih berupa teks lama (misal '1945')
  return cleanInput === cleanStored;
}
