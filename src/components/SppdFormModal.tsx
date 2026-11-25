import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  InstansiSettings,
  Pegawai,
  Pengikut,
  SppdRecord,
  SppdStatus,
  TingkatBiaya,
} from '../types/sppd';
import {
  calculateDurationDays,
  generateNextNomorSurat,
  validateSppdInput,
} from '../utils/sppdLogic';

interface SppdFormModalProps {
  open: boolean;
  initialRecord: SppdRecord | null;
  existingRecords: SppdRecord[];
  pegawaiList: Pegawai[];
  settings: InstansiSettings;
  onClose: () => void;
  onSave: (payload: Partial<SppdRecord>, editId?: string) => Promise<void>;
}

export const SppdFormModal: React.FC<SppdFormModalProps> = ({
  open,
  initialRecord,
  existingRecords,
  pegawaiList,
  settings,
  onClose,
  onSave,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [nomorSuratTugas, setNomorSuratTugas] = useState('');
  const [nomorSppd, setNomorSppd] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState(todayIso);
  const [pegawaiId, setPegawaiId] = useState('');
  const [tingkatBiaya, setTingkatBiaya] = useState<TingkatBiaya>('C');
  const [maksudPerjalanan, setMaksudPerjalanan] = useState('');
  const [dasarSurat, setDasarSurat] = useState('');
  const [alatAngkut, setAlatAngkut] = useState('Angkutan Umum / Kendaraan Pribadi');
  const [tempatBerangkat, setTempatBerangkat] = useState('MTsN 6 Ciamis (Sukadana)');
  const [tempatTujuan, setTempatTujuan] = useState('');
  const [instansiTujuan, setInstansiTujuan] = useState('');
  const [tanggalBerangkat, setTanggalBerangkat] = useState(todayIso);
  const [tanggalKembali, setTanggalKembali] = useState(todayIso);
  const [pengikut, setPengikut] = useState<Pengikut[]>([]);
  const [sumberDana, setSumberDana] = useState('');
  const [mataAnggaran, setMataAnggaran] = useState('025.04.DF.2129.QMA.006.524111');
  const [keteranganLain, setKeteranganLain] = useState('-');
  const [pejabatMengetahuiTujuan, setPejabatMengetahuiTujuan] = useState('');
  const [status, setStatus] = useState<SppdStatus>('Draft');
  const [laporanRingkas, setLaporanRingkas] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (initialRecord) {
      setNomorSuratTugas(initialRecord.nomorSuratTugas);
      setNomorSppd(initialRecord.nomorSppd);
      setTanggalSurat(initialRecord.tanggalSurat);
      setPegawaiId(initialRecord.pegawaiId);
      setTingkatBiaya(initialRecord.tingkatBiaya);
      setMaksudPerjalanan(initialRecord.maksudPerjalanan);
      setDasarSurat(initialRecord.dasarSurat);
      setAlatAngkut(initialRecord.alatAngkut);
      setTempatBerangkat(initialRecord.tempatBerangkat);
      setTempatTujuan(initialRecord.tempatTujuan);
      setInstansiTujuan(initialRecord.instansiTujuan);
      setTanggalBerangkat(initialRecord.tanggalBerangkat);
      setTanggalKembali(initialRecord.tanggalKembali);
      setPengikut(initialRecord.pengikut || []);
      setSumberDana(initialRecord.sumberDana);
      setMataAnggaran(initialRecord.mataAnggaran);
      setKeteranganLain(initialRecord.keteranganLain);
      setPejabatMengetahuiTujuan(initialRecord.pejabatMengetahuiTujuan);
      setStatus(initialRecord.status);
      setLaporanRingkas(initialRecord.laporanRingkas || '');
    } else {
      const generated = generateNextNomorSurat(
        existingRecords,
        todayIso,
        settings.awalanNomorSurat,
        settings.kodeKlasifikasiSurat,
      );
      setNomorSuratTugas(generated.nomorSuratTugas);
      setNomorSppd(generated.nomorSppd);
      setTanggalSurat(todayIso);
      const firstPeg = pegawaiList[0];
      setPegawaiId(firstPeg ? firstPeg.id : '');
      setTingkatBiaya(firstPeg ? firstPeg.tingkatBiaya : 'C');
      setMaksudPerjalanan('');
      setDasarSurat('');
      setAlatAngkut('Kendaraan Dinas / Angkutan Umum');
      setTempatBerangkat(`${settings.namaMadrasah} (${settings.tempatKedudukan})`);
      setTempatTujuan('');
      setInstansiTujuan('');
      setTanggalBerangkat(todayIso);
      setTanggalKembali(todayIso);
      setPengikut([]);
      setSumberDana(`DIPA ${settings.namaMadrasah} Tahun ${settings.tahunAnggaran}`);
      setMataAnggaran('025.04.DF.2129.QMA.006.524111');
      setKeteranganLain('-');
      setPejabatMengetahuiTujuan('');
      setStatus('Draft');
      setLaporanRingkas('');
    }
  }, [open, initialRecord, existingRecords, pegawaiList, settings, todayIso]);

  if (!open) return null;

  const selectedPegawai = pegawaiList.find((p) => p.id === pegawaiId);
  const lamaHari = calculateDurationDays(tanggalBerangkat, tanggalKembali);

  const handleSelectPegawai = (newId: string) => {
    setPegawaiId(newId);
    const peg = pegawaiList.find((p) => p.id === newId);
    if (peg) {
      setTingkatBiaya(peg.tingkatBiaya);
    }
  };

  const handleAddPengikut = () => {
    setPengikut((prev) => [
      ...prev,
      { id: `ikut-${Date.now()}`, nama: '', nip: '', keterangan: 'Pendamping / Staf' },
    ]);
  };

  const handleUpdatePengikut = (idx: number, field: keyof Pengikut, value: string) => {
    setPengikut((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemovePengikut = (idx: number) => {
    setPengikut((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSppdInput({
      nomorSppd,
      nomorSuratTugas,
      tanggalSurat,
      pegawaiId,
      maksudPerjalanan,
      tempatBerangkat,
      tempatTujuan,
      tanggalBerangkat,
      tanggalKembali,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await onSave(
        {
          nomorSppd,
          nomorSuratTugas,
          tanggalSurat,
          pegawaiId,
          tingkatBiaya,
          maksudPerjalanan,
          dasarSurat,
          alatAngkut,
          tempatBerangkat,
          tempatTujuan,
          instansiTujuan: instansiTujuan || tempatTujuan,
          tanggalBerangkat,
          tanggalKembali,
          pengikut: pengikut.filter((p) => p.nama.trim() !== ''),
          sumberDana,
          mataAnggaran,
          keteranganLain,
          pejabatMengetahuiTujuan,
          status,
          laporanRingkas,
        },
        initialRecord?.id,
      );
      onClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Gagal menyimpan data SPPD.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sppd-form-title"
    >
      <div className="my-4 w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="sppd-form-title" className="font-display text-lg font-semibold text-slate-900">
              {initialRecord ? 'Ubah Data SPPD & Surat Tugas' : 'Buat SPPD & Surat Tugas Baru'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Formulir administrasi perjalanan dinas {settings.namaMadrasah}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir SPPD"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="divide-y divide-slate-200">
          {errors.form && (
            <div className="bg-red-50 px-6 py-3 text-sm text-red-800">{errors.form}</div>
          )}

          {/* Section 1: Penomoran & Pegawai */}
          <div className="p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              1. Identitas Surat &amp; Pelaksana Tugas
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="form-nomor-st" className="block text-xs font-medium text-slate-700">
                  Nomor Surat Tugas *
                </label>
                <input
                  id="form-nomor-st"
                  type="text"
                  value={nomorSuratTugas}
                  onChange={(e) => setNomorSuratTugas(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.nomorSuratTugas && (
                  <p className="mt-1 text-xs text-red-600">{errors.nomorSuratTugas}</p>
                )}
              </div>

              <div>
                <label htmlFor="form-nomor-sppd" className="block text-xs font-medium text-slate-700">
                  Nomor SPPD *
                </label>
                <input
                  id="form-nomor-sppd"
                  type="text"
                  value={nomorSppd}
                  onChange={(e) => setNomorSppd(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.nomorSppd && (
                  <p className="mt-1 text-xs text-red-600">{errors.nomorSppd}</p>
                )}
              </div>

              <div>
                <label htmlFor="form-tgl-surat" className="block text-xs font-medium text-slate-700">
                  Tanggal Surat *
                </label>
                <input
                  id="form-tgl-surat"
                  type="date"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.tanggalSurat && (
                  <p className="mt-1 text-xs text-red-600">{errors.tanggalSurat}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="form-pegawai" className="block text-xs font-medium text-slate-700">
                  Pegawai yang Diperintahkan *
                </label>
                <select
                  id="form-pegawai"
                  value={pegawaiId}
                  onChange={(e) => handleSelectPegawai(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">-- Pilih Pegawai MTsN 6 Ciamis --</option>
                  {pegawaiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — {p.jabatan}
                    </option>
                  ))}
                </select>
                {errors.pegawaiId && (
                  <p className="mt-1 text-xs text-red-600">{errors.pegawaiId}</p>
                )}
                {selectedPegawai && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    NIP: <span className="font-mono">{selectedPegawai.nip}</span> · Pangkat:{' '}
                    {selectedPegawai.pangkatGolongan} · Jabatan: {selectedPegawai.jabatan}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="form-tingkat" className="block text-xs font-medium text-slate-700">
                  Tingkat Perjalanan Dinas
                </label>
                <select
                  id="form-tingkat"
                  value={tingkatBiaya}
                  onChange={(e) => setTingkatBiaya(e.target.value as TingkatBiaya)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="A">Tingkat A</option>
                  <option value="B">Tingkat B</option>
                  <option value="C">Tingkat C</option>
                  <option value="D">Tingkat D</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Maksud, Tujuan & Jadwal */}
          <div className="p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              2. Maksud, Lokasi Tujuan &amp; Jadwal Pelaksanaan
            </h3>

            <div>
              <label htmlFor="form-maksud" className="block text-xs font-medium text-slate-700">
                Maksud Perjalanan Dinas *
              </label>
              <textarea
                id="form-maksud"
                rows={2}
                value={maksudPerjalanan}
                onChange={(e) => setMaksudPerjalanan(e.target.value)}
                placeholder="Contoh: Menghadiri Rapat Koordinasi Kurikulum Madrasah Tingkat Kabupaten Ciamis"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
              {errors.maksudPerjalanan && (
                <p className="mt-1 text-xs text-red-600">{errors.maksudPerjalanan}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="form-dasar" className="block text-xs font-medium text-slate-700">
                  Dasar Surat / Undangan
                </label>
                <input
                  id="form-dasar"
                  type="text"
                  value={dasarSurat}
                  onChange={(e) => setDasarSurat(e.target.value)}
                  placeholder="Nomor & tanggal surat undangan/perintah"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="form-angkut" className="block text-xs font-medium text-slate-700">
                  Alat Angkut yang Dipergunakan
                </label>
                <input
                  id="form-angkut"
                  type="text"
                  value={alatAngkut}
                  onChange={(e) => setAlatAngkut(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="form-berangkat-dari" className="block text-xs font-medium text-slate-700">
                  Tempat Berangkat *
                </label>
                <input
                  id="form-berangkat-dari"
                  type="text"
                  value={tempatBerangkat}
                  onChange={(e) => setTempatBerangkat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.tempatBerangkat && (
                  <p className="mt-1 text-xs text-red-600">{errors.tempatBerangkat}</p>
                )}
              </div>

              <div>
                <label htmlFor="form-tujuan" className="block text-xs font-medium text-slate-700">
                  Tempat Tujuan *
                </label>
                <input
                  id="form-tujuan"
                  type="text"
                  value={tempatTujuan}
                  onChange={(e) => setTempatTujuan(e.target.value)}
                  placeholder="Contoh: Kantor Kemenag Kab. Ciamis"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.tempatTujuan && (
                  <p className="mt-1 text-xs text-red-600">{errors.tempatTujuan}</p>
                )}
              </div>

              <div>
                <label htmlFor="form-pejabat-tujuan" className="block text-xs font-medium text-slate-700">
                  Jabatan Pejabat di Tujuan (Visum)
                </label>
                <input
                  id="form-pejabat-tujuan"
                  type="text"
                  value={pejabatMengetahuiTujuan}
                  onChange={(e) => setPejabatMengetahuiTujuan(e.target.value)}
                  placeholder="Contoh: Kepala Seksi Penmad"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="form-tgl-berangkat" className="block text-xs font-medium text-slate-700">
                  Tanggal Berangkat *
                </label>
                <input
                  id="form-tgl-berangkat"
                  type="date"
                  value={tanggalBerangkat}
                  onChange={(e) => setTanggalBerangkat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.tanggalBerangkat && (
                  <p className="mt-1 text-xs text-red-600">{errors.tanggalBerangkat}</p>
                )}
              </div>

              <div>
                <label htmlFor="form-tgl-kembali" className="block text-xs font-medium text-slate-700">
                  Tanggal Harus Kembali *
                </label>
                <input
                  id="form-tgl-kembali"
                  type="date"
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {errors.tanggalKembali && (
                  <p className="mt-1 text-xs text-red-600">{errors.tanggalKembali}</p>
                )}
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700">
                  Lama Perjalanan Dinas
                </span>
                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {lamaHari} hari
                </div>
              </div>
            </div>

            {/* Pengikut */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Pengikut (Opsional)
                </span>
                <button
                  type="button"
                  onClick={handleAddPengikut}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tambah Pengikut</span>
                </button>
              </div>
              {pengikut.length > 0 && (
                <div className="mt-2 space-y-2">
                  {pengikut.map((p, idx) => (
                    <div key={p.id} className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center">
                      <input
                        type="text"
                        aria-label={`Nama pengikut ${idx + 1}`}
                        placeholder="Nama lengkap"
                        value={p.nama}
                        onChange={(e) => handleUpdatePengikut(idx, 'nama', e.target.value)}
                        className="sm:col-span-4 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        aria-label={`NIP pengikut ${idx + 1}`}
                        placeholder="NIP / NUPTK"
                        value={p.nip}
                        onChange={(e) => handleUpdatePengikut(idx, 'nip', e.target.value)}
                        className="sm:col-span-4 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        aria-label={`Keterangan pengikut ${idx + 1}`}
                        placeholder="Jabatan / Keterangan"
                        value={p.keterangan}
                        onChange={(e) => handleUpdatePengikut(idx, 'keterangan', e.target.value)}
                        className="sm:col-span-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePengikut(idx)}
                        aria-label={`Hapus pengikut ${idx + 1}`}
                        className="sm:col-span-1 justify-self-end rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Pembebanan Anggaran & Status */}
          <div className="p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              3. Pembebanan Anggaran &amp; Status Dokumen
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="form-sumber-dana" className="block text-xs font-medium text-slate-700">
                  Instansi Pembeban Anggaran
                </label>
                <input
                  id="form-sumber-dana"
                  type="text"
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="form-mak" className="block text-xs font-medium text-slate-700">
                  Akun / Mata Anggaran (MAK)
                </label>
                <input
                  id="form-mak"
                  type="text"
                  value={mataAnggaran}
                  onChange={(e) => setMataAnggaran(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="form-status" className="block text-xs font-medium text-slate-700">
                  Status Dokumen
                </label>
                <select
                  id="form-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SppdStatus)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label htmlFor="form-keterangan" className="block text-xs font-medium text-slate-700">
                  Keterangan Lain-lain
                </label>
                <input
                  id="form-keterangan"
                  type="text"
                  value={keteranganLain}
                  onChange={(e) => setKeteranganLain(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="form-laporan" className="block text-xs font-medium text-slate-700">
                  Ringkasan Laporan Hasil (Opsional)
                </label>
                <input
                  id="form-laporan"
                  type="text"
                  value={laporanRingkas}
                  onChange={(e) => setLaporanRingkas(e.target.value)}
                  placeholder="Catatan hasil perjalanan dinas"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 bg-slate-50 px-6 py-4 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {submitting
                ? 'Menyimpan...'
                : initialRecord
                ? 'Simpan Perubahan'
                : 'Simpan SPPD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
