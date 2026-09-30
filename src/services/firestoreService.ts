import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Pendaftaran, KuotaJenjang, BankConfig, Sponsor } from '../types';

export interface FirestoreSettingsPayload {
  quotas?: KuotaJenjang[];
  bankConfig?: BankConfig;
  sponsors?: Sponsor[];
  adminPin?: string;
}

const REGISTRATIONS_COLLECTION = 'registrations';
const SETTINGS_DOC = 'settings/general';

/**
 * Mendengarkan data pendaftaran peleton secara real-time dari Firestore.
 * Perubahan dari browser manapun otomatis masuk seketika.
 */
export function subscribeToRegistrations(
  onUpdate: (data: Pendaftaran[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const colRef = collection(db, REGISTRATIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Pendaftaran[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as Pendaftaran;
          // Validasi minimal
          if (item && item.id) {
            list.push(item);
          }
        });
        // Urutkan berdasarkan tanggal daftar terbaru
        list.sort((a, b) => new Date(b.tanggalDaftar).getTime() - new Date(a.tanggalDaftar).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Real-time listener error for registrations:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('Error attaching registration listener:', err);
    return () => {};
  }
}

/**
 * Mendengarkan pengaturan global (kuota, bank, sponsor, PIN) secara real-time.
 */
export function subscribeToSettings(
  onUpdate: (settings: FirestoreSettingsPayload) => void,
  onError?: (err: Error) => void
) {
  try {
    const docRef = doc(db, 'settings', 'general');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FirestoreSettingsPayload;
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Real-time listener error for settings:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('Error attaching settings listener:', err);
    return () => {};
  }
}

/**
 * Menyimpan / memperbarui 1 pendaftaran ke Firestore
 */
export async function saveRegistrationToFirestore(pendaftaran: Pendaftaran): Promise<void> {
  try {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, pendaftaran.id);
    await setDoc(docRef, {
      ...pendaftaran,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Gagal menyimpan pendaftaran ke Firestore:', err);
    throw err;
  }
}

/**
 * Menghapus pendaftaran dari Firestore
 */
export async function deleteRegistrationFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Gagal menghapus pendaftaran dari Firestore:', err);
    throw err;
  }
}

/**
 * Menyimpan pengaturan (kuota, bank, sponsor, pin) ke Firestore
 */
export async function saveSettingsToFirestore(payload: FirestoreSettingsPayload): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'general');
    await setDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Gagal menyimpan pengaturan ke Firestore:', err);
    throw err;
  }
}

/**
 * Inisialisasi awal pengaturan jika di Firestore belum ada
 */
export async function initializeDefaultSettingsIfEmpty(defaultSettings: FirestoreSettingsPayload): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'general');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...defaultSettings,
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Inisialisasi Firestore settings dilewati:', err);
  }
}
