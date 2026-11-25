import React, { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Upload } from 'lucide-react';
import type { InstansiSettings } from '../types/sppd';
import { KemenagCrest } from './KemenagCrest';

interface SettingsViewProps {
  settings: InstansiSettings;
  onSaveSettings: (updated: InstansiSettings) => Promise<void>;
}

async function normalizeImageToPngDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const result = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung oleh browser.'));
      img.onload = () => {
        const maxSize = 360;
        const scale = Math.min(1, maxSize / Math.max(img.width || maxSize, img.height || maxSize));
        const targetW = Math.max(1, Math.round((img.width || maxSize) * scale));
        const targetH = Math.max(1, Math.round((img.height || maxSize) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [form, setForm] = useState<InstansiSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const updateField = (key: keyof InstansiSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(false);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Pilih file gambar (PNG, JPG, WebP, atau SVG).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLogoError('Ukuran file logo maksimal 4 MB.');
      return;
    }

    setLogoError(null);
    setUploadingLogo(true);
    try {
      const pngDataUrl = await normalizeImageToPngDataUrl(file);
      const nextSettings: InstansiSettings = {
        ...form,
        logoDataUrl: pngDataUrl,
      };
      setForm(nextSettings);
      await onSaveSettings(nextSettings);
      setSavedNotice(true);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Gagal memproses gambar logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const nextSettings: InstansiSettings = {
        ...form,
        logoDataUrl: '',
      };
      setForm(nextSettings);
      await onSaveSettings(nextSettings);
      setSavedNotice(true);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(form);
      setSavedNotice(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Logo Upload Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Logo Madrasah &amp; Kop Surat
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Unggah logo resmi MTsN 6 Ciamis atau Kementerian Agama (PNG/JPG/SVG) untuk ditampilkan di sidebar, Kop Surat Tugas, dan PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
            {form.logoDataUrl ? (
              <img
                src={form.logoDataUrl}
                alt="Preview Logo Instansi"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            ) : (
              <KemenagCrest className="h-14 w-14" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                id="upload-logo-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoFileChange}
                className="sr-only"
              />
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
              >
                <Upload className="h-4 w-4 text-emerald-800" aria-hidden="true" />
                <span>{uploadingLogo ? 'Mengunggah...' : 'Unggah Logo'}</span>
              </button>

              {form.logoDataUrl && (
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={handleResetLogo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Gunakan Logo Default</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Format yang didukung: PNG (latar transparan disarankan), JPG, WebP, atau SVG. Maksimal 4 MB.
            </p>
            {logoError && <p className="text-xs text-red-600">{logoError}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Identitas Instansi &amp; Kop Surat Resmi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Informasi ini dicetak langsung pada Kop Surat Tugas dan Lembar SPPD resmi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-kementerian" className="block text-xs font-medium text-slate-700">
              Baris 1 Kop Surat
            </label>
            <input
              id="set-kementerian"
              type="text"
              value={form.kementerian}
              onChange={(e) => updateField('kementerian', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-kanwil" className="block text-xs font-medium text-slate-700">
              Baris 2 Kop Surat
            </label>
            <input
              id="set-kanwil"
              type="text"
              value={form.kanwil}
              onChange={(e) => updateField('kanwil', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-kantor" className="block text-xs font-medium text-slate-700">
              Baris 3 Kop Surat (Nama Satuan Kerja Lengkap)
            </label>
            <input
              id="set-kantor"
              type="text"
              value={form.kantorKabupaten}
              onChange={(e) => updateField('kantorKabupaten', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-nama-madrasah" className="block text-xs font-medium text-slate-700">
              Nama Singkat Madrasah
            </label>
            <input
              id="set-nama-madrasah"
              type="text"
              value={form.namaMadrasah}
              onChange={(e) => updateField('namaMadrasah', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="set-alamat" className="block text-xs font-medium text-slate-700">
            Alamat Lengkap Madrasah
          </label>
          <input
            id="set-alamat"
            type="text"
            value={form.alamatMadrasah}
            onChange={(e) => updateField('alamatMadrasah', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="set-telepon" className="block text-xs font-medium text-slate-700">
              Telepon
            </label>
            <input
              id="set-telepon"
              type="text"
              value={form.telepon}
              onChange={(e) => updateField('telepon', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-email" className="block text-xs font-medium text-slate-700">
              Email Resmi
            </label>
            <input
              id="set-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-kedudukan" className="block text-xs font-medium text-slate-700">
              Tempat Kedudukan
            </label>
            <input
              id="set-kedudukan"
              type="text"
              value={form.tempatKedudukan}
              onChange={(e) => updateField('tempatKedudukan', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-tahun" className="block text-xs font-medium text-slate-700">
              Tahun Anggaran
            </label>
            <input
              id="set-tahun"
              type="text"
              value={form.tahunAnggaran}
              onChange={(e) => updateField('tahunAnggaran', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pejabat Penandatangan &amp; Penomoran Surat
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Nama dan NIP pejabat yang tercantum pada kolom tanda tangan Surat Tugas dan SPPD.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-kepala-nama" className="block text-xs font-medium text-slate-700">
              Nama Kepala Madrasah
            </label>
            <input
              id="set-kepala-nama"
              type="text"
              value={form.kepalaMadrasahNama}
              onChange={(e) => updateField('kepalaMadrasahNama', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-kepala-nip" className="block text-xs font-medium text-slate-700">
              NIP Kepala Madrasah
            </label>
            <input
              id="set-kepala-nip"
              type="text"
              value={form.kepalaMadrasahNip}
              onChange={(e) => updateField('kepalaMadrasahNip', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="set-ppk-nama" className="block text-xs font-medium text-slate-700">
              Nama Pejabat Pembuat Komitmen (PPK)
            </label>
            <input
              id="set-ppk-nama"
              type="text"
              value={form.ppkNama}
              onChange={(e) => updateField('ppkNama', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-ppk-nip" className="block text-xs font-medium text-slate-700">
              NIP PPK
            </label>
            <input
              id="set-ppk-nip"
              type="text"
              value={form.ppkNip}
              onChange={(e) => updateField('ppkNip', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="set-awalan" className="block text-xs font-medium text-slate-700">
              Kode Satker / Awalan Nomor Surat
            </label>
            <input
              id="set-awalan"
              type="text"
              value={form.awalanNomorSurat}
              onChange={(e) => updateField('awalanNomorSurat', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-klasifikasi" className="block text-xs font-medium text-slate-700">
              Kode Klasifikasi Surat Tugas
            </label>
            <input
              id="set-klasifikasi"
              type="text"
              value={form.kodeKlasifikasiSurat}
              onChange={(e) => updateField('kodeKlasifikasiSurat', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <Check className="h-4 w-4" aria-hidden="true" />
              Pengaturan instansi tersimpan.
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </form>
  );
};
