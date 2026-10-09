import React, { useState } from 'react';
import { 
  Building, 
  Phone, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Info
} from 'lucide-react';
import { Jenjang, MetodePembayaran, AnggotaPeleton, Pendaftaran, KuotaJenjang, BankConfig } from '../types';

interface RegistrationWizardProps {
  quotas: KuotaJenjang[];
  bankConfig: BankConfig;
  onSubmitRegistration: (data: Pendaftaran) => void;
  onSuccessRegistered: (newReg: Pendaftaran) => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  quotas,
  bankConfig,
  onSubmitRegistration,
  onSuccessRegistered
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Pangkalan
  const [jenjang, setJenjang] = useState<Jenjang | null>(null);
  const [namaSekolah, setNamaSekolah] = useState('');
  const [namaPeleton, setNamaPeleton] = useState('');
  const [kotaAsal, setKotaAsal] = useState('');
  const [alamat, setAlamat] = useState('');

  // Step 2: Kontak Pembina & Pelatih
  const [namaPembina, setNamaPembina] = useState('');
  const [noWaPembina, setNoWaPembina] = useState('');
  const [namaPelatih, setNamaPelatih] = useState('');
  const [noWaPelatih, setNoWaPelatih] = useState('');

  // Step 3: Komandan Peleton (Danton)
  const [anggotaList, setAnggotaList] = useState<AnggotaPeleton[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [dantonForm, setDantonForm] = useState({
    nama: '',
    nisn: '',
    jenisKelamin: 'L' as 'L' | 'P',
    kelas: ''
  });
  const [memberError, setMemberError] = useState('');

  // Step 4: Pembayaran & Bukti Transfer
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>('LUNAS');
  const [nominalCustomDP, setNominalCustomDP] = useState<number>(100000);
  const [buktiBayarFile, setBuktiBayarFile] = useState<{ url: string; name: string } | null>(null);
  const [paktaIntegritas, setPaktaIntegritas] = useState(false);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Selected quota price
  const selectedQuota = jenjang ? (quotas.find(q => q.jenjang === jenjang) || quotas[0]) : quotas[0];
  const totalBiaya = selectedQuota.biayaPendaftaran;
  const nominalBayar = metodePembayaran === 'LUNAS' ? totalBiaya : Math.max(selectedQuota.dpMinimal, nominalCustomDP);
  const sisaBayar = Math.max(0, totalBiaya - nominalBayar);

  // Phone validator
  const isValidIndonesianPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return /^(08|628)\d{8,12}$/.test(cleaned);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors: string[] = [];
    if (!jenjang) errors.push('Pilih salah satu Jenjang Perlombaan (SD/MI, SMP/MTs, atau SMA/SMK/MA) terlebih dahulu');
    if (!namaSekolah.trim()) errors.push('Nama Sekolah / Madrasah wajib diisi');
    if (!namaPeleton.trim()) errors.push('Nama Peleton wajib diisi');
    if (!kotaAsal.trim()) errors.push('Kota / Kabupaten Asal wajib diisi');
    if (!alamat.trim()) errors.push('Alamat lengkap pangkalan wajib diisi');
    setFormErrors(errors);
    return errors.length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors: string[] = [];
    if (!namaPembina.trim()) errors.push('Nama Pembina wajib diisi');
    if (!isValidIndonesianPhone(noWaPembina)) errors.push('Nomor WhatsApp Pembina tidak valid (Gunakan format 08xx atau 628xx)');
    if (!namaPelatih.trim()) errors.push('Nama Pelatih wajib diisi');
    if (!isValidIndonesianPhone(noWaPelatih)) errors.push('Nomor WhatsApp Pelatih tidak valid (Gunakan format 08xx atau 628xx)');
    setFormErrors(errors);
    return errors.length === 0;
  };

  // Step 3 Validation: Only Danton required
  const validateStep3 = () => {
    const errors: string[] = [];
    const hasDanton = anggotaList.some(a => a.peran === 'Danton');
    if (!hasDanton) {
      errors.push('Komandan Peleton (Danton) wajib diinput sebelum melanjutkan ke langkah berikutnya.');
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  // Step 4 Validation: Hanya Bukti Transfer Pembayaran & Pakta Integritas
  const validateStep4 = () => {
    const errors: string[] = [];
    if (!buktiBayarFile) errors.push('Bukti transfer pembayaran (Lunas/DP) wajib diunggah');
    if (!paktaIntegritas) errors.push('Anda wajib menyetujui Pakta Integritas & Keaslian Data');
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  // Danton Management
  const handleOpenDantonModal = () => {
    const existingDanton = anggotaList.find(a => a.peran === 'Danton');
    if (existingDanton) {
      setDantonForm({
        nama: existingDanton.nama,
        nisn: existingDanton.nisn,
        jenisKelamin: existingDanton.jenisKelamin,
        kelas: existingDanton.kelas
      });
    } else {
      setDantonForm({
        nama: '',
        nisn: '',
        jenisKelamin: 'L',
        kelas: ''
      });
    }
    setMemberError('');
    setIsMemberModalOpen(true);
  };

  const handleSaveDanton = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    if (!dantonForm.nama.trim()) {
      setMemberError('Nama lengkap Komandan Peleton (Danton) wajib diisi');
      return;
    }
    if (!/^\d{10}$/.test(dantonForm.nisn.trim())) {
      setMemberError('NISN Danton wajib terdiri tepat dari 10 digit angka!');
      return;
    }

    const dantonMember: AnggotaPeleton = {
      id: 'danton-' + Date.now(),
      nama: dantonForm.nama.trim(),
      nisn: dantonForm.nisn.trim(),
      peran: 'Danton',
      jenisKelamin: dantonForm.jenisKelamin,
      kelas: dantonForm.kelas.trim() || 'Danton'
    };

    // Replace existing danton if already present, keeping other members if any
    const otherMembers = anggotaList.filter(a => a.peran !== 'Danton');
    setAnggotaList([dantonMember, ...otherMembers]);
    setIsMemberModalOpen(false);
  };

  const handleRemoveDanton = () => {
    setAnggotaList(anggotaList.filter(a => a.peran !== 'Danton'));
  };

  // File Upload Handlers (converts to base64 DataURL for reliable preview & storage)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas melebihi batas maksimal 5 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBuktiBayarFile({ url: result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Fast sample team generator to make testing effortless
  const populateSampleTeam = () => {
    const sampleNames = [
      'Muhammad Al-Fatih', 'Bintang Ramadhan', 'Satria Pratama', 'Aditya Wijaya',
      'Gilang Gumilang', 'Rizky Kurniawan', 'Fajar Nurhadi', 'Dimas Anggoro',
      'Bagus Hendra', 'Arief Budiman', 'Rendi Syahputra', 'Teguh Wicaksono',
      'Irfan Maulana', 'Bayu Tri Laksono', 'Yuda Perkasa', 'Danang Prasetyo'
    ];

    const generated: AnggotaPeleton[] = [
      {
        id: 'ang-sample-danton',
        nama: 'Arya Surya Kusuma',
        nisn: '0078912345',
        peran: 'Danton',
        jenisKelamin: 'L',
        kelas: 'XII MIPA'
      },
      ...sampleNames.map((name, i) => ({
        id: `ang-sample-${i}`,
        nama: name,
        nisn: `008912345${i}`,
        peran: 'Pasukan' as const,
        jenisKelamin: 'L' as const,
        kelas: 'XI MIPA'
      }))
    ];
    setAnggotaList(generated);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenjang) {
      setFormErrors(['Pilih salah satu Jenjang Perlombaan (SD/MI, SMP/MTs, atau SMA/SMK/MA) terlebih dahulu']);
      return;
    }
    if (!validateStep4()) return;

    setIsSubmitting(true);

    const sequence = Math.floor(Math.random() * 900 + 100);
    const currentYear = new Date().getFullYear();
    const noReg = `REG-LKBB4-${currentYear}-${sequence}`;

    const newRegData: Pendaftaran = {
      id: 'reg-' + Date.now(),
      noRegistrasi: noReg,
      noTampil: null,
      jenjang: jenjang,
      namaSekolah,
      npsn: '',
      namaPeleton,
      kotaAsal,
      alamat,
      namaPembina,
      noWaPembina,
      namaPelatih,
      noWaPelatih,
      emailResmi: '',
      anggota: anggotaList,
      metodePembayaran,
      nominalBayar,
      nominalHarusBayar: totalBiaya,
      statusPembayaran: metodePembayaran === 'LUNAS' ? 'Lunas' : 'DP',
      sisaPembayaran: sisaBayar,
      buktiBayarUrl: buktiBayarFile?.url || '',
      buktiBayarNama: buktiBayarFile?.name || 'bukti_transfer.jpg',
      status: 'Menunggu Verifikasi',
      tanggalDaftar: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    };

    setTimeout(() => {
      onSubmitRegistration(newRegData);
      setIsSubmitting(false);
      onSuccessRegistered(newRegData);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
          FORMULIR REGISTRASI RESMI
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Pendaftaran Peleton Peserta LKBB GARUDA IV
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Silakan lengkapi 4 tahapan formulir di bawah ini dengan data yang valid dan dapat dipertanggungjawabkan.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { num: 1, label: 'Pangkalan', icon: Building },
          { num: 2, label: 'Kontak', icon: Phone },
          { num: 3, label: 'Danton', icon: UserCheck },
          { num: 4, label: 'Bukti Bayar', icon: CreditCard }
        ].map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              className={`p-3 rounded-xl border flex flex-col items-center sm:flex-row sm:gap-3 transition-all ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-400 shadow-md shadow-amber-500/10'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                  : 'bg-[#101b35] border-[#1e2d4d] text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-[#172648] text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <div className="mt-1 sm:mt-0 text-center sm:text-left truncate">
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">Langkah {s.num}</div>
                <div className="text-xs font-bold truncate text-slate-200">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Error Banner */}
      {formErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Mohon lengkapi bagian berikut sebelum melanjutkan:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-[#101b35] border border-[#1e2d4d] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* STEP 1: PANGKALAN */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Identitas Pangkalan & Satuan Sekolah</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pilih jenjang mata lomba terlebih dahulu untuk mengaktifkan pengisian data pokok sekolah pangkalan pendaftar.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Jenjang Perlombaan <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['SD/MI', 'SMP/MTs', 'SMA/SMK/MA'] as Jenjang[]).map((j) => (
                    <button
                      type="button"
                      key={j}
                      onClick={() => setJenjang(j)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        jenjang === j
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-xs font-bold ${jenjang === j ? 'text-amber-400' : 'text-slate-300'}`}>
                          {j}
                        </span>
                        {jenjang === j && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-semibold">
                        Biaya: Rp {(quotas.find(q => q.jenjang === j)?.biayaPendaftaran || 0).toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informational Guidance if Jenjang is not yet selected */}
              {!jenjang ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Silakan klik salah satu <b>Jenjang Perlombaan</b> di atas untuk mengaktifkan kolom pengisian identitas sekolah pangkalan di bawah ini.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Jenjang <b>{jenjang}</b> terpilih. Kolom identitas sekolah kini aktif.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 transition-colors ${!jenjang ? 'text-slate-500' : 'text-slate-300'}`}>
                    Nama Sekolah / Pangkalan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!jenjang}
                    value={namaSekolah}
                    onChange={(e) => setNamaSekolah(e.target.value)}
                    placeholder={!jenjang ? 'Pilih jenjang perlombaan terlebih dahulu...' : 'Contoh: SMAN 1 Sukabumi'}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs transition-all ${
                      !jenjang
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 placeholder:text-slate-600 cursor-not-allowed select-none'
                        : 'bg-slate-950 border-slate-700 text-white focus:outline-none focus:border-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 transition-colors ${!jenjang ? 'text-slate-500' : 'text-slate-300'}`}>
                    Nama Peleton / Satuan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!jenjang}
                    value={namaPeleton}
                    onChange={(e) => setNamaPeleton(e.target.value)}
                    placeholder={!jenjang ? 'Pilih jenjang perlombaan terlebih dahulu...' : 'Contoh: Bratasena Swastika A'}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs transition-all ${
                      !jenjang
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 placeholder:text-slate-600 cursor-not-allowed select-none'
                        : 'bg-slate-950 border-slate-700 text-white focus:outline-none focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 transition-colors ${!jenjang ? 'text-slate-500' : 'text-slate-300'}`}>
                    Kabupaten / Kota Asal <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!jenjang}
                    value={kotaAsal}
                    onChange={(e) => setKotaAsal(e.target.value)}
                    placeholder={!jenjang ? 'Pilih jenjang perlombaan terlebih dahulu...' : 'Contoh: Kota Sukabumi / Kab. Cianjur'}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs transition-all ${
                      !jenjang
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 placeholder:text-slate-600 cursor-not-allowed select-none'
                        : 'bg-slate-950 border-slate-700 text-white focus:outline-none focus:border-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 transition-colors ${!jenjang ? 'text-slate-500' : 'text-slate-300'}`}>
                    Alamat Lengkap Sekolah <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!jenjang}
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder={!jenjang ? 'Pilih jenjang perlombaan terlebih dahulu...' : 'Jl. Nama Jalan No. XX, Kecamatan, Kelurahan...'}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs transition-all ${
                      !jenjang
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 placeholder:text-slate-600 cursor-not-allowed select-none'
                        : 'bg-slate-950 border-slate-700 text-white focus:outline-none focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: KONTAK */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-400" />
                <span>Kontak Penanggung Jawab & Official</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Wajib mencantumkan nomor aktif WhatsApp untuk koordinasi Technical Meeting dan grup info peserta.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Lengkap Pembina <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPembina}
                    onChange={(e) => setNamaPembina(e.target.value)}
                    placeholder="Contoh: Drs. H. Mulyana, M.Pd."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    No. WhatsApp Pembina (Format 08/62) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={noWaPembina}
                    onChange={(e) => setNoWaPembina(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Lengkap Pelatih <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPelatih}
                    onChange={(e) => setNamaPelatih(e.target.value)}
                    placeholder="Contoh: Rizki Ramadhan, S.Or."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    No. WhatsApp Pelatih (Format 08/62) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={noWaPelatih}
                    onChange={(e) => setNoWaPelatih(e.target.value)}
                    placeholder="Contoh: 085712345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Nomor WhatsApp aktif akan digunakan panitia untuk koordinasi Technical Meeting (TM) dan verifikasi berkas.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: KOMANDAN PELETON (DANTON) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>Data Komandan Peleton (Danton)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pada tahap ini, masukkan data Komandan Peleton (Danton) yang akan memimpin peleton lomba.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenDantonModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{anggotaList.some(a => a.peran === 'Danton') ? 'Ubah Data Danton' : '+ Input Data Danton'}</span>
              </button>
            </div>

            {/* Danton Display Card */}
            {(() => {
              const danton = anggotaList.find(a => a.peran === 'Danton');
              if (!danton) {
                return (
                  <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    <div className="text-sm font-bold text-white">Komandan Peleton (Danton) Belum Diinput</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Silakan klik tombol <b>+ Input Data Danton</b> di atas untuk melengkapi nama, NISN (10 digit), jenis kelamin, dan kelas Danton.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenDantonModal}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Input Data Danton Sekarang</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider">
                        KOMANDAN PELETON (DANTON)
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar Sah
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenDantonModal}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold"
                      >
                        Ubah Data
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveDanton}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950"
                        title="Hapus Data Danton"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Nama Lengkap Danton</div>
                      <div className="text-sm font-bold text-white mt-0.5">{danton.nama}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">NISN (10 Digit)</div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">{danton.nisn}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Jenis Kelamin</div>
                      <div className="text-sm font-semibold text-slate-200 mt-0.5">
                        {danton.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Kelas / Tingkat</div>
                      <div className="text-sm font-semibold text-slate-200 mt-0.5">{danton.kelas}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 italic bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                    * Catatan: Data susunan 16 pasukan dan official lainnya dapat diserahkan saat daftar ulang / verifikasi berkas sebelum Technical Meeting.
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 4: PEMBAYARAN & BUKTI TRANSFER */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>Metode Pembayaran & Unggah Bukti Transfer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lakukan transfer ke rekening panitia dan lampirkan bukti transfer pembayaran (Lunas/DP).
              </p>
            </div>

            {/* Payment Choice */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Pilih Skema Pembayaran <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('LUNAS')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    metodePembayaran === 'LUNAS'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Pembayaran Lunas (100%)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Disarankan
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-black font-mono text-emerald-400">
                    Rp {totalBiaya.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Langsung terdaftar penuh tanpa kewajiban pelunasan susulan.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodePembayaran('DP')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    metodePembayaran === 'DP'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Uang Muka / DP (Kunci Kuota)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      Min. Rp 100.000
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-black font-mono text-amber-400">
                    Rp {nominalBayar.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Sisa pembayaran Rp {sisaBayar.toLocaleString('id-ID')} dapat disusulkan sebelum TM.
                  </div>
                </button>
              </div>

              {metodePembayaran === 'DP' && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nominal DP yang Ditransfer (Minimal Rp {selectedQuota.dpMinimal.toLocaleString('id-ID')})
                  </label>
                  <input
                    type="number"
                    min={selectedQuota.dpMinimal}
                    max={totalBiaya}
                    step={50000}
                    value={nominalCustomDP}
                    onChange={(e) => setNominalCustomDP(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Sisa yang harus dilunasi:</span>
                    <span className="font-mono font-bold text-red-400">Rp {sisaBayar.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bank summary reminder */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Tujuan Transfer: {bankConfig.bankName}</span>
              </div>
              <div className="font-mono text-amber-400 font-bold text-sm tracking-wide">
                No. Rek: {bankConfig.nomorRekening} a.n {bankConfig.atasNama}
              </div>
            </div>

            {/* File Upload: Hanya Bukti Transfer Pembayaran */}
            <div className="p-5 rounded-2xl bg-[#0b1329] border border-[#1e2d4d] space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Unggah Bukti Transfer Pembayaran <span className="text-red-400">*</span></span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">JPG, PNG, atau PDF (Maks 5 MB)</span>
              </div>
              
              <div className="border-2 border-dashed border-[#1e2d4d] hover:border-amber-400/70 rounded-2xl p-6 text-center cursor-pointer relative bg-[#101b35]/60 transition-all group">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                {buktiBayarFile ? (
                  <div className="space-y-1.5 py-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-white truncate max-w-md mx-auto">{buktiBayarFile.name}</div>
                    <div className="text-xs text-emerald-400 font-semibold">Berkas bukti transfer siap dikirim</div>
                    <div className="text-[11px] text-slate-400">Klik untuk mengganti berkas</div>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm text-slate-200 font-bold">Pilih atau seret berkas bukti transfer ke sini</div>
                    <div className="text-xs text-slate-400">Struk transfer ATM, screenshot m-Banking, atau bukti setor tunai bank</div>
                  </div>
                )}
              </div>
            </div>

            {/* Pakta Integritas */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paktaIntegritas}
                  onChange={(e) => setPaktaIntegritas(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  <b>Pakta Integritas & Pernyataan Keabsahan Data:</b> Saya menyatakan dengan sesungguhnya bahwa seluruh data pangkalan, kontak pembina/pelatih, serta bukti transfer pembayaran yang diunggah adalah sah, asli, dan memenuhi juklak/juknis resmi LKBB GARUDA IV - SMKS PGRI 1 Kota Sukabumi.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                currentStep === 1 && !jenjang
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>Lanjut ke Langkah {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 transition-all shadow-xl shadow-red-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses & Menyimpan Data...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kirim Registrasi Sekarang</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal Input Data Danton */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 className="text-sm font-bold text-white">Input Data Komandan Peleton (Danton)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveDanton} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Lengkap Danton <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dantonForm.nama}
                  onChange={(e) => setDantonForm({ ...dantonForm, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Al-Fatih"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  NISN Danton (Wajib Tepat 10 Digit Angka) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={dantonForm.nisn}
                  onChange={(e) => setDantonForm({ ...dantonForm, nisn: e.target.value.replace(/\D/g, '') })}
                  placeholder="Contoh: 0071234567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {dantonForm.nisn.length}/10 Digit Angka
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={dantonForm.jenisKelamin}
                    onChange={(e) => setDantonForm({ ...dantonForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kelas / Tingkat</label>
                  <input
                    type="text"
                    value={dantonForm.kelas}
                    onChange={(e) => setDantonForm({ ...dantonForm, kelas: e.target.value })}
                    placeholder="Contoh: XII IPA 1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {memberError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-[11px]">
                  {memberError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20"
                >
                  Simpan Data Danton
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
