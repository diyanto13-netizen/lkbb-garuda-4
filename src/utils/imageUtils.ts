/**
 * Image processing utilities for logos and uploads
 * Resizes and optimizes images to prevent corrupted base64 data and storage overflow
 */

export function processLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
      reject(new Error('Format file tidak didukung. Harap unggah berkas PNG, JPG, WEBP, atau SVG.'));
      return;
    }

    // Max 10MB input check
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ukuran file terlalu besar. Maksimal 10 MB.'));
      return;
    }

    // If SVG, read as text/dataURL directly to preserve vector sharpness
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Gagal membaca berkas SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Optimize dimensions (max 400px width/height while maintaining aspect ratio)
        const maxDimension = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG to preserve transparent background for logos
        try {
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
          resolve(optimizedDataUrl);
        } catch {
          resolve(readerEvent.target?.result as string);
        }
      };

      img.onerror = () => {
        reject(new Error('Berkas gambar rusak atau tidak dapat diproses.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas logo.'));
    };

    reader.readAsDataURL(file);
  });
}
