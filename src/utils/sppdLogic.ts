import type { RincianBiaya, SppdRecord, SppdStatus } from '../types/sppd';

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Calculates inclusive travel duration in days between two ISO YYYY-MM-DD dates.
 * Returns 0 if either date is invalid or end date precedes start date.
 */
export function calculateDurationDays(tanggalBerangkat: string, tanggalKembali: string): number {
  if (!tanggalBerangkat || !tanggalKembali) return 0;
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalBerangkat);
  const endMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalKembali);
  if (!startMatch || !endMatch) return 0;

  const startUtc = Date.UTC(
    Number(startMatch[1]),
    Number(startMatch[2]) - 1,
    Number(startMatch[3]),
  );
  const endUtc = Date.UTC(
    Number(endMatch[1]),
    Number(endMatch[2]) - 1,
    Number(endMatch[3]),
  );

  if (endUtc < startUtc) return 0;
  const diffDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Calculates itemized total SPPD cost.
 */
export function calculateTotalBiaya(biaya: RincianBiaya, lamaHari: number): number {
  const days = Math.max(0, Math.floor(lamaHari));
  const nights = Math.max(0, Math.floor(biaya.jumlahMalam || 0));
  const uangHarianTotal = Math.max(0, biaya.uangHarianPerHari || 0) * days;
  const penginapanTotal = Math.max(0, biaya.biayaPenginapanPerMalam || 0) * nights;
  const transport = Math.max(0, biaya.transportPergiPulang || 0);
  const representasi = Math.max(0, biaya.uangRepresentasi || 0);
  const riil = Math.max(0, biaya.pengeluaranRiil || 0);
  return uangHarianTotal + penginapanTotal + transport + representasi + riil;
}

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function terbilangRecursive(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${terbilangRecursive(n - 10)} Belas`;
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${terbilangRecursive(puluh)} Puluh${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 200) {
    const sisa = n - 100;
    return `Seratus${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 1000) {
    const ratus = Math.floor(n / 100);
    const sisa = n % 100;
    return `${terbilangRecursive(ratus)} Ratus${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 2000) {
    const sisa = n - 1000;
    return `Seribu${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 1_000_000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return `${terbilangRecursive(ribu)} Ribu${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 1_000_000_000) {
    const juta = Math.floor(n / 1_000_000);
    const sisa = n % 1_000_000;
    return `${terbilangRecursive(juta)} Juta${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  if (n < 1_000_000_000_000) {
    const miliar = Math.floor(n / 1_000_000_000);
    const sisa = n % 1_000_000_000;
    return `${terbilangRecursive(miliar)} Miliar${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
  }
  const triliun = Math.floor(n / 1_000_000_000_000);
  const sisa = n % 1_000_000_000_000;
  return `${terbilangRecursive(triliun)} Triliun${sisa ? ` ${terbilangRecursive(sisa)}` : ''}`;
}

/**
 * Converts a non-negative integer into lowercase Indonesian words (e.g., 3 -> "tiga").
 */
export function numberToIndonesianWords(amount: number): string {
  const rounded = Math.round(Math.max(0, amount));
  if (rounded === 0) return 'nol';
  return terbilangRecursive(rounded).trim().toLowerCase();
}

/**
 * Converts a non-negative Rupiah integer into formal Indonesian words.
 */
export function numberToTerbilang(amount: number): string {
  const rounded = Math.round(Math.max(0, amount));
  if (rounded === 0) return 'Nol Rupiah';
  return `${terbilangRecursive(rounded).trim()} Rupiah`;
}

/**
 * Formats integer amount into standard Indonesian Rupiah string (e.g., "Rp 1.250.000").
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return `Rp ${formatted}`;
}

/**
 * Formats ISO date (YYYY-MM-DD) into formal Indonesian date (e.g., "25 November 2026").
 */
export function formatTanggalIndonesia(isoDate: string): string {
  if (!isoDate) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = BULAN_INDONESIA[monthIdx];
  if (!monthName) return isoDate;
  return `${day} ${monthName} ${year}`;
}

/**
 * Returns Indonesian weekday name for an ISO date (YYYY-MM-DD).
 */
export function getHariIndonesia(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return HARI_INDONESIA[date.getUTCDay()] ?? '';
}

/**
 * Generates sequential official Kemenag Surat Tugas & SPPD numbers.
 */
export function generateNextNomorSurat(
  existingRecords: SppdRecord[],
  tanggalSurat: string,
  awalanNomorSurat: string,
  kodeKlasifikasi: string,
): { nomorSuratTugas: string; nomorSppd: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalSurat);
  const year = match ? match[1] : String(new Date().getFullYear());
  const month = match ? match[2] : String(new Date().getMonth() + 1).padStart(2, '0');

  const nextSeq = existingRecords.length + 1;
  const seqPadded = String(nextSeq).padStart(3, '0');

  const prefix = awalanNomorSurat || 'MTs.10.07.06';
  const klasifikasi = kodeKlasifikasi || 'KP.01.1';

  return {
    nomorSuratTugas: `B-${seqPadded}/${prefix}/${klasifikasi}/${month}/${year}`,
    nomorSppd: `${seqPadded}/SPPD/${prefix}/${month}/${year}`,
  };
}

export interface SppdFilterOptions {
  search?: string;
  status?: SppdStatus | 'Semua';
  month?: string; // YYYY-MM or 'Semua'
}

/**
 * Filters and sorts SPPD records (newest tanggalSurat first).
 */
export function filterSppdRecords(
  records: SppdRecord[],
  options: SppdFilterOptions,
): SppdRecord[] {
  const q = (options.search || '').trim().toLowerCase();
  const status = options.status || 'Semua';
  const month = options.month || 'Semua';

  return records
    .filter((rec) => {
      if (status !== 'Semua' && rec.status !== status) return false;
      if (month !== 'Semua' && !rec.tanggalBerangkat.startsWith(month)) return false;
      if (q) {
        const haystack = [
          rec.nomorSppd,
          rec.nomorSuratTugas,
          rec.pegawaiNama,
          rec.pegawaiNip,
          rec.maksudPerjalanan,
          rec.tempatTujuan,
          rec.instansiTujuan,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.tanggalBerangkat.localeCompare(a.tanggalBerangkat));
}

export interface DashboardSummary {
  totalSppd: number;
  draftCount: number;
  disetujuiCount: number;
  selesaiCount: number;
  totalAnggaran: number;
  totalHariTugas: number;
}

export function computeDashboardSummary(records: SppdRecord[]): DashboardSummary {
  return records.reduce<DashboardSummary>(
    (acc, rec) => {
      acc.totalSppd += 1;
      if (rec.status === 'Draft') acc.draftCount += 1;
      else if (rec.status === 'Disetujui') acc.disetujuiCount += 1;
      else if (rec.status === 'Selesai') acc.selesaiCount += 1;
      acc.totalAnggaran += rec.totalBiaya || 0;
      acc.totalHariTugas += rec.lamaHari || 0;
      return acc;
    },
    {
      totalSppd: 0,
      draftCount: 0,
      disetujuiCount: 0,
      selesaiCount: 0,
      totalAnggaran: 0,
      totalHariTugas: 0,
    },
  );
}

export interface SppdValidationInput {
  nomorSppd: string;
  nomorSuratTugas: string;
  tanggalSurat: string;
  pegawaiId: string;
  maksudPerjalanan: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
}

export function validateSppdInput(input: SppdValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.nomorSuratTugas.trim()) {
    errors.nomorSuratTugas = 'Nomor Surat Tugas wajib diisi.';
  }
  if (!input.nomorSppd.trim()) {
    errors.nomorSppd = 'Nomor SPPD wajib diisi.';
  }
  if (!input.tanggalSurat) {
    errors.tanggalSurat = 'Tanggal surat wajib diisi.';
  }
  if (!input.pegawaiId) {
    errors.pegawaiId = 'Pilih pegawai yang melaksanakan perjalanan dinas.';
  }
  if (!input.maksudPerjalanan.trim()) {
    errors.maksudPerjalanan = 'Maksud perjalanan dinas wajib diisi.';
  }
  if (!input.tempatBerangkat.trim()) {
    errors.tempatBerangkat = 'Tempat berangkat wajib diisi.';
  }
  if (!input.tempatTujuan.trim()) {
    errors.tempatTujuan = 'Tempat tujuan wajib diisi.';
  }
  if (!input.tanggalBerangkat) {
    errors.tanggalBerangkat = 'Tanggal berangkat wajib diisi.';
  }
  if (!input.tanggalKembali) {
    errors.tanggalKembali = 'Tanggal kembali wajib diisi.';
  }
  if (input.tanggalBerangkat && input.tanggalKembali) {
    const duration = calculateDurationDays(input.tanggalBerangkat, input.tanggalKembali);
    if (duration <= 0) {
      errors.tanggalKembali = 'Tanggal kembali tidak boleh sebelum tanggal berangkat.';
    }
  }
  return errors;
}
