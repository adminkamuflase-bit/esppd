import * as XLSX from 'xlsx';
import type { SppdRecord } from '../types/sppd';
import { formatTanggalIndonesia } from './sppdLogic';

export interface SppdExportRow {
  'No.': number;
  'Nomor SPPD': string;
  'Nomor Surat Tugas': string;
  'Tanggal Surat': string;
  'Nama Pegawai': string;
  NIP: string;
  'Pangkat / Golongan': string;
  Jabatan: string;
  'Tingkat Perjalanan': string;
  'Maksud Perjalanan Dinas': string;
  'Dasar Surat': string;
  'Alat Angkut': string;
  'Tempat Berangkat': string;
  'Tempat Tujuan': string;
  'Tanggal Berangkat': string;
  'Tanggal Kembali': string;
  'Lama (Hari)': number;
  'Jumlah Pengikut': number;
  'Daftar Pengikut': string;
  'Pembebanan Anggaran': string;
  'Akun / MAK': string;
  Status: string;
  Keterangan: string;
}

export function buildSppdExportRows(records: SppdRecord[]): SppdExportRow[] {
  return records.map((rec, index) => {
    const pengikutStr =
      rec.pengikut && rec.pengikut.length > 0
        ? rec.pengikut
            .map((p) => `${p.nama}${p.nip ? ` (${p.nip})` : ''}`)
            .join('; ')
        : '-';

    return {
      'No.': index + 1,
      'Nomor SPPD': rec.nomorSppd,
      'Nomor Surat Tugas': rec.nomorSuratTugas,
      'Tanggal Surat': formatTanggalIndonesia(rec.tanggalSurat),
      'Nama Pegawai': rec.pegawaiNama,
      NIP: rec.pegawaiNip,
      'Pangkat / Golongan': rec.pegawaiPangkat,
      Jabatan: rec.pegawaiJabatan,
      'Tingkat Perjalanan': `Tingkat ${rec.tingkatBiaya}`,
      'Maksud Perjalanan Dinas': rec.maksudPerjalanan,
      'Dasar Surat': rec.dasarSurat || '-',
      'Alat Angkut': rec.alatAngkut,
      'Tempat Berangkat': rec.tempatBerangkat,
      'Tempat Tujuan': rec.tempatTujuan,
      'Tanggal Berangkat': formatTanggalIndonesia(rec.tanggalBerangkat),
      'Tanggal Kembali': formatTanggalIndonesia(rec.tanggalKembali),
      'Lama (Hari)': rec.lamaHari,
      'Jumlah Pengikut': rec.pengikut ? rec.pengikut.length : 0,
      'Daftar Pengikut': pengikutStr,
      'Pembebanan Anggaran': rec.sumberDana,
      'Akun / MAK': rec.mataAnggaran,
      Status: rec.status,
      Keterangan: rec.laporanRingkas || rec.keteranganLain || '-',
    };
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const EXPORT_HEADERS: Array<keyof SppdExportRow> = [
  'No.',
  'Nomor SPPD',
  'Nomor Surat Tugas',
  'Tanggal Surat',
  'Nama Pegawai',
  'NIP',
  'Pangkat / Golongan',
  'Jabatan',
  'Tingkat Perjalanan',
  'Maksud Perjalanan Dinas',
  'Dasar Surat',
  'Alat Angkut',
  'Tempat Berangkat',
  'Tempat Tujuan',
  'Tanggal Berangkat',
  'Tanggal Kembali',
  'Lama (Hari)',
  'Jumlah Pengikut',
  'Daftar Pengikut',
  'Pembebanan Anggaran',
  'Akun / MAK',
  'Status',
  'Keterangan',
];

/**
 * Generates UTF-8 BOM CSV content compatible with Microsoft Excel (ID locale).
 */
export function buildSppdCsvContent(records: SppdRecord[]): string {
  const rows = buildSppdExportRows(records);
  const headerLine = EXPORT_HEADERS.map((h) => escapeCsvCell(h)).join(',');
  const dataLines = rows.map((row) =>
    EXPORT_HEADERS.map((h) => escapeCsvCell(row[h])).join(','),
  );
  return `\uFEFF${[headerLine, ...dataLines].join('\r\n')}`;
}

export function buildExportFilename(ext: 'xlsx' | 'csv', dateIso?: string): string {
  const stamp = (dateIso || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return `Rekap_SPPD_MTsN6_Ciamis_${stamp}.${ext}`;
}

export function exportSppdToXlsx(records: SppdRecord[]): string {
  const rows = buildSppdExportRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS });
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 44 },
    { wch: 36 },
    { wch: 26 },
    { wch: 26 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 32 },
    { wch: 28 },
    { wch: 28 },
    { wch: 12 },
    { wch: 34 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data SPPD');
  const filename = buildExportFilename('xlsx');
  XLSX.writeFile(workbook, filename);
  return filename;
}

export function exportSppdToCsv(records: SppdRecord[]): string {
  const csv = buildSppdCsvContent(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = buildExportFilename('csv');

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
