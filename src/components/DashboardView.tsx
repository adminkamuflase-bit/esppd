import React from 'react';
import { Printer, Pencil, ArrowRight, CheckCircle2, Clock, FileCheck2, FileSpreadsheet } from 'lucide-react';
import type { SppdRecord, SppdStatus } from '../types/sppd';
import {
  computeDashboardSummary,
  formatTanggalIndonesia,
} from '../utils/sppdLogic';
import { exportSppdToXlsx } from '../utils/sppdExport';

interface DashboardViewProps {
  records: SppdRecord[];
  pegawaiCount: number;
  tahunAnggaran: string;
  onCreateNew: () => void;
  onViewAllSppd: () => void;
  onPrintSppd: (record: SppdRecord) => void;
  onEditSppd: (record: SppdRecord) => void;
}

export const StatusLabel: React.FC<{ status: SppdStatus }> = ({ status }) => {
  if (status === 'Selesai') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        <span>Selesai</span>
      </span>
    );
  }
  if (status === 'Disetujui') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-800 whitespace-nowrap">
        <FileCheck2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
        <span>Disetujui</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
      <span>Draft</span>
    </span>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  pegawaiCount,
  tahunAnggaran,
  onCreateNew,
  onViewAllSppd,
  onPrintSppd,
  onEditSppd,
}) => {
  const summary = computeDashboardSummary(records);
  const recentRecords = [...records]
    .sort((a, b) => b.tanggalBerangkat.localeCompare(a.tanggalBerangkat))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Metrics Grid */}
      <section aria-label="Ringkasan Statistik SPPD" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total SPPD · TA {tahunAnggaran}</p>
          <p
            data-testid="kpi-total-sppd"
            className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums"
          >
            {summary.totalSppd}
          </p>
          <p className="mt-1 text-xs text-slate-500">Surat perjalanan dinas diterbitkan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Hari Tugas</p>
          <p className="mt-2 inline-flex items-baseline gap-1.5 font-mono text-2xl font-semibold text-emerald-800 tabular-nums">
            <span>{summary.totalHariTugas}</span>
            <span className="font-sans text-sm font-normal text-slate-500">hari</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Akumulasi durasi perjalanan dinas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Status Dokumen</p>
          <p className="mt-2 inline-flex items-baseline gap-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            <span>{summary.selesaiCount}</span>
            <span className="font-sans text-sm font-normal text-slate-500">selesai</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.disetujuiCount} disetujui · {summary.draftCount} draft
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Pegawai Terdaftar</p>
          <p
            data-testid="kpi-total-pegawai"
            className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums"
          >
            {pegawaiCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Guru &amp; Tenaga Kependidikan</p>
        </div>
      </section>

      {/* Recent SPPD Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Perjalanan Dinas Terbaru
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Daftar surat perintah perjalanan dinas dan surat tugas MTsN 6 Ciamis
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => exportSppdToXlsx(records)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onViewAllSppd}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-900 whitespace-nowrap shrink-0"
            >
              <span>Lihat Semua SPPD</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {recentRecords.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Belum ada data perjalanan dinas.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Buat SPPD pertama untuk mencetak Surat Tugas dan Lembar SPPD resmi.
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 whitespace-nowrap"
            >
              Buat SPPD Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="pl-5 pr-3 py-3 font-medium">Nomor &amp; Tanggal</th>
                  <th className="px-3 py-3 font-medium">Pegawai</th>
                  <th className="px-3 py-3 font-medium">Tujuan &amp; Maksud</th>
                  <th className="px-3 py-3 font-medium">Pelaksanaan</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="pl-3 pr-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {recentRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="pl-5 pr-3 py-3.5 align-top">
                      <p className="font-mono text-xs font-medium text-slate-900 tabular-nums">
                        {rec.nomorSppd}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatTanggalIndonesia(rec.tanggalSurat)}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top max-w-[190px]">
                      <p className="font-medium text-slate-900 truncate" title={rec.pegawaiNama}>
                        {rec.pegawaiNama}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                        {rec.pegawaiNip}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-top max-w-[270px]">
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
                      <StatusLabel status={rec.status} />
                    </td>
                    <td className="pl-3 pr-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onPrintSppd(rec)}
                          aria-label={`Cetak SPPD ${rec.nomorSppd}`}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
