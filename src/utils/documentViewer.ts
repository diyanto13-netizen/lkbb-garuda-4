/**
 * Utility untuk menangani pembukaan berkas, gambar, dan PDF secara aman di browser
 * Mengatasi pembatasan Chrome pada data: URL (Not allowed to navigate top frame to data URL)
 */

export const isPdfDocument = (url?: string, fileName?: string): boolean => {
  if (!url) return false;
  if (url.startsWith('data:application/pdf')) return true;
  if (url.toLowerCase().includes('.pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'))) return true;
  return false;
};

/**
 * Konversi data: URL menjadi Blob URL yang aman dibuka di tab baru browser
 */
export const dataUrlToBlobUrl = (dataUrl: string): string | null => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    
    const blob = new Blob([buffer], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Gagal mengonversi dataUrl ke Blob:', e);
    return null;
  }
};

/**
 * Buka dokumen atau gambar di tab baru secara aman
 */
export const openDocumentInNewTab = (url: string, fileName: string = 'Dokumen') => {
  if (!url) return;

  // Jika URL web biasa (http / https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Jika data: URL (base64)
  if (url.startsWith('data:')) {
    const blobUrl = dataUrlToBlobUrl(url);
    if (blobUrl) {
      const newWin = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!newWin) {
        // Jika terblokir popup, gunakan tautan download sementara
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener,noreferrer';
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      return;
    }

    // Fallback: render HTML wrapper jika dataUrlToBlobUrl gagal
    const newWin = window.open('', '_blank');
    if (newWin) {
      if (url.startsWith('data:application/pdf')) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>${fileName}</title></head>
          <body style="margin:0; height:100vh; overflow:hidden;">
            <embed src="${url}" type="application/pdf" width="100%" height="100%" />
          </body>
          </html>
        `);
      } else {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>${fileName}</title></head>
          <body style="margin:0; background:#090d16; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${url}" style="max-width:100%; max-height:100vh; object-fit:contain;" alt="${fileName}" />
          </body>
          </html>
        `);
      }
    }
  }
};

/**
 * Unduh dokumen ke perangkat lokal
 */
export const downloadDocumentFile = (url: string, fileName: string) => {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Fallback URL untuk Bukti Transfer Pembayaran jika gambar rusak / tidak terbaca
 */
export const DEFAULT_BUKTI_BAYAR_PREVIEW = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80';

/**
 * Fallback SVG Data URL untuk Surat Tugas Resmi jika gambar pendaftar rusak / tidak terbaca
 */
export const DEFAULT_SURAT_TUGAS_PREVIEW = 'https://images.unsplash.com/photo-1568667256549-094345857637?w=1200&auto=format&fit=crop&q=80';
