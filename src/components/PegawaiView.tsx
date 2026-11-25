import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import type { Pegawai, StatusKepegawaian, TingkatBiaya } from '../types/sppd';

interface PegawaiViewProps {
  pegawaiList: Pegawai[];
  onSavePegawai: (payload: Partial<Pegawai>, editId?: string) => Promise<void>;
  onDeletePegawai: (pegawai: Pegawai) => void;
}

export const PegawaiView: React.FC<PegawaiViewProps> = ({
  pegawaiList,
  onSavePegawai,
  onDeletePegawai,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);

  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [pangkatGolongan, setPangkatGolongan] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [tingkatBiaya, setTingkatBiaya] = useState<TingkatBiaya>('C');
  const [statusKepegawaian, setStatusKepegawaian] = useState<StatusKepegawaian>('PNS');
  const [unitKerja, setUnitKerja] = useState('MTsN 6 Ciamis');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingPegawai(null);
    setNama('');
    setNip('');
    setPangkatGolongan('');
    setJabatan('');
    setTingkatBiaya('C');
    setStatusKepegawaian('PNS');
    setUnitKerja('MTsN 6 Ciamis');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEdit = (p: Pegawai) => {
    setEditingPegawai(p);
    setNama(p.nama);
    setNip(p.nip);
    setPangkatGolongan(p.pangkatGolongan);
    setJabatan(p.jabatan);
    setTingkatBiaya(p.tingkatBiaya);
    setStatusKepegawaian(p.statusKepegawaian);
    setUnitKerja(p.unitKerja);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !jabatan.trim()) {
      setErrorMsg('Nama lengkap dan jabatan pegawai wajib diisi.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await onSavePegawai(
        {
          nama,
          nip,
          pangkatGolongan,
          jabatan,
          tingkatBiaya,
          statusKepegawaian,
          unitKerja,
        },
        editingPegawai?.id,
      );
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data pegawai.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = pegawaiList.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nama.toLowerCase().includes(q) ||
      p.nip.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Data Guru &amp; Tenaga Kependidikan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Master pegawai untuk pengisian otomatis data pelaksana SPPD
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="pegawai-search" className="sr-only">
                Cari nama atau NIP pegawai
              </label>
              <input
                id="pegawai-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIP, jabatan..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Pegawai</span>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Tidak ada data pegawai ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-6 py-3 font-medium">Nama Lengkap</th>
                  <th className="px-4 py-3 font-medium">NIP / NUPTK</th>
                  <th className="px-4 py-3 font-medium">Pangkat / Golongan</th>
                  <th className="px-4 py-3 font-medium">Jabatan</th>
                  <th className="px-4 py-3 font-medium">Status · Tingkat</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{p.nama}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {p.nip}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{p.pangkatGolongan}</td>
                    <td className="px-4 py-3.5 text-slate-700">{p.jabatan}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {p.statusKepegawaian} · Tingkat {p.tingkatBiaya}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={`Ubah data pegawai ${p.nama}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePegawai(p)}
                          aria-label={`Hapus data pegawai ${p.nama}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Pegawai Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pegawai-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 id="pegawai-modal-title" className="font-display text-base font-semibold text-slate-900">
                {editingPegawai ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup form pegawai"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMsg}</div>
              )}

              <div>
                <label htmlFor="peg-nama" className="block text-xs font-medium text-slate-700">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  id="peg-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="peg-nip" className="block text-xs font-medium text-slate-700">
                    NIP / NUPTK
                  </label>
                  <input
                    id="peg-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="198001012005011001"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="peg-pangkat" className="block text-xs font-medium text-slate-700">
                    Pangkat / Golongan
                  </label>
                  <input
                    id="peg-pangkat"
                    type="text"
                    value={pangkatGolongan}
                    onChange={(e) => setPangkatGolongan(e.target.value)}
                    placeholder="Penata Tk. I / III.d"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="peg-jabatan" className="block text-xs font-medium text-slate-700">
                  Jabatan *
                </label>
                <input
                  id="peg-jabatan"
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Guru Mata Pelajaran / Wakamad / Staf TU"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="peg-status" className="block text-xs font-medium text-slate-700">
                    Status Kepegawaian
                  </label>
                  <select
                    id="peg-status"
                    value={statusKepegawaian}
                    onChange={(e) => setStatusKepegawaian(e.target.value as StatusKepegawaian)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Non-ASN">Non-ASN</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="peg-tingkat" className="block text-xs font-medium text-slate-700">
                    Tingkat Biaya SPPD
                  </label>
                  <select
                    id="peg-tingkat"
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
