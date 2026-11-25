import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExportFilename,
  buildSppdCsvContent,
  buildSppdExportRows,
} from './sppdExport';
import { DEFAULT_SEED_DATA } from '../data/seedData';

test('buildSppdExportRows maps SPPD records into structured Excel columns', () => {
  const rows = buildSppdExportRows(DEFAULT_SEED_DATA.sppd);
  assert.equal(rows.length, DEFAULT_SEED_DATA.sppd.length);
  assert.equal(rows[0]['No.'], 1);
  assert.equal(rows[0]['Nomor SPPD'], '001/SPPD/MTs.10.07.06/11/2026');
  assert.equal(rows[0]['Tanggal Surat'], '4 November 2026');
  assert.equal(rows[0]['Lama (Hari)'], 1);
  assert.equal(rows[1]['Jumlah Pengikut'], 1);
  assert.ok(rows[1]['Daftar Pengikut'].includes('Asep Saepudin'));
});

test('buildSppdCsvContent generates UTF-8 BOM and properly escapes commas/quotes', () => {
  const sample = [
    {
      ...DEFAULT_SEED_DATA.sppd[0],
      maksudPerjalanan: 'Rapat Evaluasi, Anggaran "Triwulan IV"',
    },
  ];
  const csv = buildSppdCsvContent(sample);
  assert.ok(csv.startsWith('\uFEFFNo.,Nomor SPPD,'));
  assert.ok(csv.includes('"Rapat Evaluasi, Anggaran ""Triwulan IV"""'));
});

test('buildExportFilename formats dated xlsx and csv filenames', () => {
  assert.equal(
    buildExportFilename('xlsx', '2026-11-25'),
    'Rekap_SPPD_MTsN6_Ciamis_20261125.xlsx',
  );
  assert.equal(
    buildExportFilename('csv', '2026-11-25'),
    'Rekap_SPPD_MTsN6_Ciamis_20261125.csv',
  );
});
