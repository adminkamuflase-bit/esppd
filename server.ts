import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_SEED_DATA } from './src/data/seedData';
import type { AppDatabase, InstansiSettings, Pegawai, SppdRecord, SppdStatus } from './src/types/sppd';
import { calculateDurationDays, calculateTotalBiaya, validateSppdInput } from './src/utils/sppdLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sppd-db.json');

function ensureDb(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_SEED_DATA, null, 2), 'utf-8');
    return structuredClone(DEFAULT_SEED_DATA);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppDatabase;
    return {
      settings: { ...DEFAULT_SEED_DATA.settings, ...(parsed.settings || {}) },
      pegawai: Array.isArray(parsed.pegawai) ? parsed.pegawai : DEFAULT_SEED_DATA.pegawai,
      sppd: Array.isArray(parsed.sppd) ? parsed.sppd : DEFAULT_SEED_DATA.sppd,
    };
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_SEED_DATA, null, 2), 'utf-8');
    return structuredClone(DEFAULT_SEED_DATA);
  }
}

function saveDb(db: AppDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Initialize DB file on boot
  ensureDb();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/bootstrap', (_req, res) => {
    const db = ensureDb();
    res.json(db);
  });

  // SPPD Endpoints
  app.post('/api/sppd', (req, res) => {
    const body = req.body as Partial<SppdRecord>;
    const errors = validateSppdInput({
      nomorSppd: String(body.nomorSppd || ''),
      nomorSuratTugas: String(body.nomorSuratTugas || ''),
      tanggalSurat: String(body.tanggalSurat || ''),
      pegawaiId: String(body.pegawaiId || ''),
      maksudPerjalanan: String(body.maksudPerjalanan || ''),
      tempatBerangkat: String(body.tempatBerangkat || ''),
      tempatTujuan: String(body.tempatTujuan || ''),
      tanggalBerangkat: String(body.tanggalBerangkat || ''),
      tanggalKembali: String(body.tanggalKembali || ''),
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ message: 'Validasi data SPPD gagal.', errors });
      return;
    }

    const db = ensureDb();
    const pegawai = db.pegawai.find((p) => p.id === body.pegawaiId);
    if (!pegawai) {
      res.status(400).json({ message: 'Data pegawai tidak ditemukan.' });
      return;
    }

    const lamaHari = calculateDurationDays(
      String(body.tanggalBerangkat),
      String(body.tanggalKembali),
    );
    const biaya = {
      uangHarianPerHari: Number(body.biaya?.uangHarianPerHari || 0),
      transportPergiPulang: Number(body.biaya?.transportPergiPulang || 0),
      biayaPenginapanPerMalam: Number(body.biaya?.biayaPenginapanPerMalam || 0),
      jumlahMalam: Number(body.biaya?.jumlahMalam || 0),
      uangRepresentasi: Number(body.biaya?.uangRepresentasi || 0),
      pengeluaranRiil: Number(body.biaya?.pengeluaranRiil || 0),
      keteranganBiaya: String(body.biaya?.keteranganBiaya || ''),
    };
    const totalBiaya = calculateTotalBiaya(biaya, lamaHari);
    const now = new Date().toISOString();

    const newRecord: SppdRecord = {
      id: `sppd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nomorSppd: String(body.nomorSppd).trim(),
      nomorSuratTugas: String(body.nomorSuratTugas).trim(),
      tanggalSurat: String(body.tanggalSurat),
      pegawaiId: pegawai.id,
      pegawaiNama: pegawai.nama,
      pegawaiNip: pegawai.nip,
      pegawaiPangkat: pegawai.pangkatGolongan,
      pegawaiJabatan: pegawai.jabatan,
      tingkatBiaya: body.tingkatBiaya || pegawai.tingkatBiaya,
      maksudPerjalanan: String(body.maksudPerjalanan).trim(),
      dasarSurat: String(body.dasarSurat || '').trim(),
      alatAngkut: String(body.alatAngkut || 'Angkutan Umum').trim(),
      tempatBerangkat: String(body.tempatBerangkat).trim(),
      tempatTujuan: String(body.tempatTujuan).trim(),
      instansiTujuan: String(body.instansiTujuan || body.tempatTujuan).trim(),
      tanggalBerangkat: String(body.tanggalBerangkat),
      tanggalKembali: String(body.tanggalKembali),
      lamaHari,
      pengikut: Array.isArray(body.pengikut) ? body.pengikut : [],
      sumberDana: String(body.sumberDana || `DIPA ${db.settings.namaMadrasah}`).trim(),
      mataAnggaran: String(body.mataAnggaran || '524111').trim(),
      keteranganLain: String(body.keteranganLain || '-').trim(),
      pejabatMengetahuiTujuan: String(body.pejabatMengetahuiTujuan || '').trim(),
      biaya,
      totalBiaya,
      status: (body.status as SppdStatus) || 'Draft',
      laporanRingkas: String(body.laporanRingkas || '').trim(),
      createdAt: now,
      updatedAt: now,
    };

    db.sppd.unshift(newRecord);
    saveDb(db);
    res.status(201).json(newRecord);
  });

  app.put('/api/sppd/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<SppdRecord>;
    const errors = validateSppdInput({
      nomorSppd: String(body.nomorSppd || ''),
      nomorSuratTugas: String(body.nomorSuratTugas || ''),
      tanggalSurat: String(body.tanggalSurat || ''),
      pegawaiId: String(body.pegawaiId || ''),
      maksudPerjalanan: String(body.maksudPerjalanan || ''),
      tempatBerangkat: String(body.tempatBerangkat || ''),
      tempatTujuan: String(body.tempatTujuan || ''),
      tanggalBerangkat: String(body.tanggalBerangkat || ''),
      tanggalKembali: String(body.tanggalKembali || ''),
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ message: 'Validasi data SPPD gagal.', errors });
      return;
    }

    const db = ensureDb();
    const index = db.sppd.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Data SPPD tidak ditemukan.' });
      return;
    }

    const pegawai = db.pegawai.find((p) => p.id === body.pegawaiId);
    if (!pegawai) {
      res.status(400).json({ message: 'Data pegawai tidak ditemukan.' });
      return;
    }

    const lamaHari = calculateDurationDays(
      String(body.tanggalBerangkat),
      String(body.tanggalKembali),
    );
    const biaya = {
      uangHarianPerHari: Number(body.biaya?.uangHarianPerHari || 0),
      transportPergiPulang: Number(body.biaya?.transportPergiPulang || 0),
      biayaPenginapanPerMalam: Number(body.biaya?.biayaPenginapanPerMalam || 0),
      jumlahMalam: Number(body.biaya?.jumlahMalam || 0),
      uangRepresentasi: Number(body.biaya?.uangRepresentasi || 0),
      pengeluaranRiil: Number(body.biaya?.pengeluaranRiil || 0),
      keteranganBiaya: String(body.biaya?.keteranganBiaya || ''),
    };
    const totalBiaya = calculateTotalBiaya(biaya, lamaHari);

    const existing = db.sppd[index];
    const updated: SppdRecord = {
      ...existing,
      nomorSppd: String(body.nomorSppd).trim(),
      nomorSuratTugas: String(body.nomorSuratTugas).trim(),
      tanggalSurat: String(body.tanggalSurat),
      pegawaiId: pegawai.id,
      pegawaiNama: pegawai.nama,
      pegawaiNip: pegawai.nip,
      pegawaiPangkat: pegawai.pangkatGolongan,
      pegawaiJabatan: pegawai.jabatan,
      tingkatBiaya: body.tingkatBiaya || pegawai.tingkatBiaya,
      maksudPerjalanan: String(body.maksudPerjalanan).trim(),
      dasarSurat: String(body.dasarSurat || '').trim(),
      alatAngkut: String(body.alatAngkut || 'Angkutan Umum').trim(),
      tempatBerangkat: String(body.tempatBerangkat).trim(),
      tempatTujuan: String(body.tempatTujuan).trim(),
      instansiTujuan: String(body.instansiTujuan || body.tempatTujuan).trim(),
      tanggalBerangkat: String(body.tanggalBerangkat),
      tanggalKembali: String(body.tanggalKembali),
      lamaHari,
      pengikut: Array.isArray(body.pengikut) ? body.pengikut : [],
      sumberDana: String(body.sumberDana || existing.sumberDana).trim(),
      mataAnggaran: String(body.mataAnggaran || existing.mataAnggaran).trim(),
      keteranganLain: String(body.keteranganLain || '-').trim(),
      pejabatMengetahuiTujuan: String(body.pejabatMengetahuiTujuan || '').trim(),
      biaya,
      totalBiaya,
      status: (body.status as SppdStatus) || existing.status,
      laporanRingkas: String(body.laporanRingkas || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    db.sppd[index] = updated;
    saveDb(db);
    res.json(updated);
  });

  app.patch('/api/sppd/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: SppdStatus };
    if (!status || !['Draft', 'Disetujui', 'Selesai'].includes(status)) {
      res.status(400).json({ message: 'Status SPPD tidak valid.' });
      return;
    }

    const db = ensureDb();
    const index = db.sppd.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Data SPPD tidak ditemukan.' });
      return;
    }

    db.sppd[index] = {
      ...db.sppd[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json(db.sppd[index]);
  });

  app.delete('/api/sppd/:id', (req, res) => {
    const { id } = req.params;
    const db = ensureDb();
    const prevLength = db.sppd.length;
    db.sppd = db.sppd.filter((item) => item.id !== id);
    if (db.sppd.length === prevLength) {
      res.status(404).json({ message: 'Data SPPD tidak ditemukan.' });
      return;
    }
    saveDb(db);
    res.json({ deletedId: id });
  });

  // Pegawai Endpoints
  app.post('/api/pegawai', (req, res) => {
    const body = req.body as Partial<Pegawai>;
    if (!body.nama?.trim() || !body.jabatan?.trim()) {
      res.status(400).json({ message: 'Nama dan Jabatan pegawai wajib diisi.' });
      return;
    }

    const db = ensureDb();
    const newPegawai: Pegawai = {
      id: `peg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nama: body.nama.trim(),
      nip: (body.nip || '-').trim(),
      pangkatGolongan: (body.pangkatGolongan || '-').trim(),
      jabatan: body.jabatan.trim(),
      tingkatBiaya: body.tingkatBiaya || 'C',
      statusKepegawaian: body.statusKepegawaian || 'PNS',
      unitKerja: (body.unitKerja || 'MTsN 6 Ciamis').trim(),
    };
    db.pegawai.push(newPegawai);
    saveDb(db);
    res.status(201).json(newPegawai);
  });

  app.put('/api/pegawai/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<Pegawai>;
    if (!body.nama?.trim() || !body.jabatan?.trim()) {
      res.status(400).json({ message: 'Nama dan Jabatan pegawai wajib diisi.' });
      return;
    }

    const db = ensureDb();
    const index = db.pegawai.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Data pegawai tidak ditemukan.' });
      return;
    }

    db.pegawai[index] = {
      ...db.pegawai[index],
      nama: body.nama.trim(),
      nip: (body.nip || '-').trim(),
      pangkatGolongan: (body.pangkatGolongan || '-').trim(),
      jabatan: body.jabatan.trim(),
      tingkatBiaya: body.tingkatBiaya || db.pegawai[index].tingkatBiaya,
      statusKepegawaian: body.statusKepegawaian || db.pegawai[index].statusKepegawaian,
      unitKerja: (body.unitKerja || db.pegawai[index].unitKerja).trim(),
    };
    saveDb(db);
    res.json(db.pegawai[index]);
  });

  app.delete('/api/pegawai/:id', (req, res) => {
    const { id } = req.params;
    const db = ensureDb();
    const prevLength = db.pegawai.length;
    db.pegawai = db.pegawai.filter((p) => p.id !== id);
    if (db.pegawai.length === prevLength) {
      res.status(404).json({ message: 'Data pegawai tidak ditemukan.' });
      return;
    }
    saveDb(db);
    res.json({ deletedId: id });
  });

  // Settings Endpoint
  app.put('/api/settings', (req, res) => {
    const body = req.body as Partial<InstansiSettings>;
    const db = ensureDb();
    db.settings = {
      ...db.settings,
      ...body,
    };
    saveDb(db);
    res.json(db.settings);
  });

  // Vite dev middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SPPD MTsN 6 Ciamis berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer();
