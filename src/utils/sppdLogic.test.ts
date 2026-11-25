import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDurationDays,
  calculateTotalBiaya,
  computeDashboardSummary,
  filterSppdRecords,
  formatRupiah,
  formatTanggalIndonesia,
  generateNextNomorSurat,
  getHariIndonesia,
  numberToIndonesianWords,
  numberToTerbilang,
  validateSppdInput,
} from './sppdLogic';
import type { SppdRecord } from '../types/sppd';

test('calculateDurationDays computes inclusive day count and rejects reversed dates', () => {
  assert.equal(calculateDurationDays('2026-11-25', '2026-11-25'), 1);
  assert.equal(calculateDurationDays('2026-11-25', '2026-11-27'), 3);
  assert.equal(calculateDurationDays('2026-11-28', '2026-11-25'), 0);
  assert.equal(calculateDurationDays('', '2026-11-25'), 0);
});

test('calculateTotalBiaya sums uang harian, penginapan, transport, representasi, and riil', () => {
  const total = calculateTotalBiaya(
    {
      uangHarianPerHari: 170000,
      transportPergiPulang: 250000,
      biayaPenginapanPerMalam: 450000,
      jumlahMalam: 1,
      uangRepresentasi: 0,
      pengeluaranRiil: 50000,
      keteranganBiaya: 'Biaya sesuai SBM',
    },
    2,
  );
  assert.equal(total, 170000 * 2 + 250000 + 450000 + 50000);
});

test('numberToTerbilang and numberToIndonesianWords convert numbers into formal Indonesian words', () => {
  assert.equal(numberToIndonesianWords(1), 'satu');
  assert.equal(numberToIndonesianWords(3), 'tiga');
  assert.equal(numberToTerbilang(0), 'Nol Rupiah');
  assert.equal(numberToTerbilang(150000), 'Seratus Lima Puluh Ribu Rupiah');
  assert.equal(numberToTerbilang(1250000), 'Satu Juta Dua Ratus Lima Puluh Ribu Rupiah');
  assert.equal(numberToTerbilang(11500), 'Sebelas Ribu Lima Ratus Rupiah');
});

test('formatRupiah and formatTanggalIndonesia format correctly', () => {
  assert.equal(formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(formatTanggalIndonesia('2026-11-25'), '25 November 2026');
  assert.equal(getHariIndonesia('2026-11-25'), 'Rabu');
});

test('generateNextNomorSurat produces Kemenag-formatted numbering', () => {
  const res = generateNextNomorSurat([], '2026-11-25', 'MTs.10.07.06', 'KP.01.1');
  assert.equal(res.nomorSuratTugas, 'B-001/MTs.10.07.06/KP.01.1/11/2026');
  assert.equal(res.nomorSppd, '001/SPPD/MTs.10.07.06/11/2026');
});

test('filterSppdRecords filters by search, status, and month', () => {
  const sample: SppdRecord[] = [
    {
      id: '1',
      nomorSppd: '001/SPPD/MTs.10.07.06/11/2026',
      nomorSuratTugas: 'B-001/MTs.10.07.06/KP.01.1/11/2026',
      tanggalSurat: '2026-11-10',
      pegawaiId: 'p1',
      pegawaiNama: 'Drs. H. Ahmad Fauzi, M.Pd.',
      pegawaiNip: '197005121998031004',
      pegawaiPangkat: 'Pembina / IV.a',
      pegawaiJabatan: 'Kepala Madrasah',
      tingkatBiaya: 'B',
      maksudPerjalanan: 'Rapat Koordinasi Kepala Madrasah',
      dasarSurat: 'Undangan Kemenag',
      alatAngkut: 'Kendaraan Dinas',
      tempatBerangkat: 'MTsN 6 Ciamis',
      tempatTujuan: 'Kantor Kemenag Kab. Ciamis',
      instansiTujuan: 'Kemenag Ciamis',
      tanggalBerangkat: '2026-11-12',
      tanggalKembali: '2026-11-12',
      lamaHari: 1,
      pengikut: [],
      sumberDana: 'DIPA MTsN 6 Ciamis',
      mataAnggaran: '524111',
      keteranganLain: '-',
      pejabatMengetahuiTujuan: 'Kepala Subbag TU Kemenag Ciamis',
      biaya: {
        uangHarianPerHari: 150000,
        transportPergiPulang: 100000,
        biayaPenginapanPerMalam: 0,
        jumlahMalam: 0,
        uangRepresentasi: 0,
        pengeluaranRiil: 0,
        keteranganBiaya: '',
      },
      totalBiaya: 250000,
      status: 'Selesai',
      laporanRingkas: 'Terlaksana dengan baik.',
      createdAt: '2026-11-10T08:00:00Z',
      updatedAt: '2026-11-12T16:00:00Z',
    },
    {
      id: '2',
      nomorSppd: '002/SPPD/MTs.10.07.06/10/2026',
      nomorSuratTugas: 'B-002/MTs.10.07.06/KP.01.1/10/2026',
      tanggalSurat: '2026-10-20',
      pegawaiId: 'p2',
      pegawaiNama: 'Siti Aminah, S.Pd.I.',
      pegawaiNip: '198403152011012008',
      pegawaiPangkat: 'Penata / III.c',
      pegawaiJabatan: 'Wakamad Kurikulum',
      tingkatBiaya: 'C',
      maksudPerjalanan: 'Bimtek Kurikulum Merdeka',
      dasarSurat: 'Surat Kanwil Jabar',
      alatAngkut: 'Angkutan Umum / Bus',
      tempatBerangkat: 'MTsN 6 Ciamis',
      tempatTujuan: 'Bandung',
      instansiTujuan: 'Kanwil Kemenag Prov. Jawa Barat',
      tanggalBerangkat: '2026-10-22',
      tanggalKembali: '2026-10-24',
      lamaHari: 3,
      pengikut: [],
      sumberDana: 'DIPA MTsN 6 Ciamis',
      mataAnggaran: '524111',
      keteranganLain: '-',
      pejabatMengetahuiTujuan: 'Kabid Penmad Kanwil Jabar',
      biaya: {
        uangHarianPerHari: 430000,
        transportPergiPulang: 300000,
        biayaPenginapanPerMalam: 550000,
        jumlahMalam: 2,
        uangRepresentasi: 0,
        pengeluaranRiil: 0,
        keteranganBiaya: '',
      },
      totalBiaya: 2690000,
      status: 'Draft',
      laporanRingkas: '',
      createdAt: '2026-10-20T08:00:00Z',
      updatedAt: '2026-10-20T08:00:00Z',
    },
  ];

  assert.equal(filterSppdRecords(sample, { status: 'Selesai' }).length, 1);
  assert.equal(filterSppdRecords(sample, { search: 'bandung' }).length, 1);
  assert.equal(filterSppdRecords(sample, { month: '2026-11' }).length, 1);

  const summary = computeDashboardSummary(sample);
  assert.equal(summary.totalSppd, 2);
  assert.equal(summary.selesaiCount, 1);
  assert.equal(summary.draftCount, 1);
  assert.equal(summary.totalHariTugas, 4);
});

test('validateSppdInput catches missing fields and invalid date ranges', () => {
  const errors = validateSppdInput({
    nomorSppd: '',
    nomorSuratTugas: '',
    tanggalSurat: '2026-11-25',
    pegawaiId: '',
    maksudPerjalanan: '',
    tempatBerangkat: 'Ciamis',
    tempatTujuan: '',
    tanggalBerangkat: '2026-11-26',
    tanggalKembali: '2026-11-24',
  });
  assert.ok(errors.nomorSppd);
  assert.ok(errors.nomorSuratTugas);
  assert.ok(errors.pegawaiId);
  assert.ok(errors.maksudPerjalanan);
  assert.ok(errors.tempatTujuan);
  assert.ok(errors.tanggalKembali);
});
