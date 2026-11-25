import React, { useMemo, useState } from 'react';
import { Printer, Pencil, Trash2, Search, Plus } from 'lucide-react';
import type { SppdRecord, SppdStatus } from '../types/sppd';
import {
  filterSppdRecords,
  formatTanggalIndonesia,
} from '../utils/sppdLogic';
import { StatusLabel } from './DashboardView';

interface SppdListViewProps {
  records: SppdRecord[];
  onCreateNew: () => void;
  onPrintSppd: (record: SppdRecord) => void;
  onEditSppd: (record: SppdRecord) => void;
  onChangeStatus: (id: string, status: SppdStatus) => Promise<void>;
  onDeleteSppd: (record: SppdRecord) => void;
}

const STATUS_TABS: Array<SppdStatus | 'Semua'> = ['Semua', 'Draft', 'Disetujui', 'Selesai'];

export const SppdListView: React.FC<SppdListViewProps> = ({
  records,
  onCreateNew,
  onPrintSppd,
  onEditSppd,
  onChangeStatus,
  onDeleteSppd,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SppdStatus | 'Semua'>('Semua');
  const [monthFilter, setMonthFilter] = useState<string>('Semua');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const r of records) {
      if (r.tanggalBerangkat && r.tanggalBerangkat.length >= 7) {
        months.add(r.tanggalBerangkat.slice(0, 7));
      }
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filtered = useMemo(
    () => filterSppdRecords(records, { search, status: statusFilter, month: monthFilter }),
    [records, search, statusFilter, monthFilter],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented status filter */}
            <div
              role="group"
              aria-label="Filter status SPPD"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            >
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Month select */}
            <div className="flex items-center gap-2">
              <label htmlFor="sppd-month-filter" className="sr-only">
                Filter Bulan
              </label>
              <select
                id="sppd-month-filter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-700 focus:outline-none"
              >
                <option value="Semua">Semua Bulan</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {ym}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72 sm:flex-initial">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="sppd-search-input" className="sr-only">
                Cari nomor SPPD, nama pegawai, atau tujuan
              </label>
              <input
                id="sppd-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor, pegawai, tujuan..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah SPPD</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {records.length === 0
                ? 'Belum ada data SPPD yang tercatat.'
                : 'Tidak ada SPPD yang sesuai dengan filter pencarian.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {records.length === 0
                ? 'Klik tombol Tambah SPPD untuk membuat surat perjalanan dinas baru.'
                : 'Ubah kata kunci pencarian atau pilih filter status lainnya.'}
            </p>
            {records.length === 0 && (
              <button
                type="button"
                onClick={onCreateNew}
                className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
              >
                Tambah SPPD Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="pl-5 pr-3 py-3 font-medium">Nomor SPPD &amp; ST</th>
                  <th className="px-3 py-3 font-medium">Pelaksana</th>
                  <th className="px-3 py-3 font-medium">Tujuan &amp; Maksud</th>
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="pl-3 pr-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="pl-5 pr-3 py-3.5 align-top max-w-[200px]">
                      <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums truncate" title={rec.nomorSppd}>
                        {rec.nomorSppd}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums truncate" title={rec.nomorSuratTugas}>
                        ST: {rec.nomorSuratTugas}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top max-w-[190px]">
                      <p className="font-medium text-slate-900 truncate" title={rec.pegawaiNama}>
                        {rec.pegawaiNama}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {rec.pegawaiJabatan}
                        {rec.pengikut.length > 0 && ` · +${rec.pengikut.length}`}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top max-w-[260px]">
                      <p className="font-medium text-slate-900 truncate" title={rec.tempatTujuan}>
                        {rec.tempatTujuan}
                      </p>
                      <p
                        className="mt-0.5 text-xs text-slate-500 line-clamp-2"
                        title={rec.maksudPerjalanan}
                      >
                        {rec.maksudPerjalanan}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-800 tabular-nums">
                        {formatTanggalIndonesia(rec.tanggalBerangkat)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {rec.lamaHari} hari
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top">
                      <div className="flex flex-col gap-1">
                        <StatusLabel status={rec.status} />
                        <label htmlFor={`status-${rec.id}`} className="sr-only">
                          Ubah status SPPD {rec.nomorSppd}
                        </label>
                        <select
                          id={`status-${rec.id}`}
                          value={rec.status}
                          onChange={(e) => onChangeStatus(rec.id, e.target.value as SppdStatus)}
                          className="mt-0.5 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </div>
                    </td>
                    <td className="pl-3 pr-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onPrintSppd(rec)}
                          aria-label={`Lihat dan cetak SPPD ${rec.nomorSppd}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Cetak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditSppd(rec)}
                          aria-label={`Ubah SPPD ${rec.nomorSppd}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSppd(rec)}
                          aria-label={`Hapus SPPD ${rec.nomorSppd}`}
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
    </div>
  );
};
