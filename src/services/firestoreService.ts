import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { DEFAULT_SEED_DATA } from '../data/seedData';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type {
  InstansiSettings,
  Pegawai,
  Pengikut,
  RincianBiaya,
  SppdRecord,
  SppdStatus,
} from '../types/sppd';
import { calculateDurationDays, validateSppdInput } from '../utils/sppdLogic';

const EMPTY_BIAYA: RincianBiaya = {
  uangHarianPerHari: 0,
  transportPergiPulang: 0,
  biayaPenginapanPerMalam: 0,
  jumlahMalam: 0,
  uangRepresentasi: 0,
  pengeluaranRiil: 0,
  keteranganBiaya: '',
};

function tsToIso(val: unknown, fallback?: string): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  return fallback || new Date().toISOString();
}

function clampStr(val: unknown, max: number): string {
  const s = typeof val === 'string' ? val.trim() : '';
  return s.length > max ? s.slice(0, max) : s;
}

function sanitizePengikut(list: unknown): Pengikut[] {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((item, idx) => {
    const obj = (item || {}) as Partial<Pengikut>;
    return {
      id: clampStr(obj.id, 64) || `ikut-${idx + 1}`,
      nama: clampStr(obj.nama, 120),
      nip: clampStr(obj.nip, 40) || '-',
      keterangan: clampStr(obj.keterangan, 160) || '-',
    };
  });
}

function buildSettingsDoc(ownerId: string, settings: InstansiSettings) {
  return {
    ownerId,
    kementerian: clampStr(settings.kementerian, 150),
    kanwil: clampStr(settings.kanwil, 150),
    kantorKabupaten: clampStr(settings.kantorKabupaten, 150),
    namaMadrasah: clampStr(settings.namaMadrasah, 120) || 'MTsN 6 CIAMIS',
    alamatMadrasah: clampStr(settings.alamatMadrasah, 300),
    telepon: clampStr(settings.telepon, 40),
    email: clampStr(settings.email, 120),
    website: clampStr(settings.website, 120),
    kodePos: clampStr(settings.kodePos, 16),
    tempatKedudukan: clampStr(settings.tempatKedudukan, 100),
    kodeSatker: clampStr(settings.kodeSatker, 40),
    tahunAnggaran: clampStr(settings.tahunAnggaran, 10) || '2026',
    kepalaMadrasahNama: clampStr(settings.kepalaMadrasahNama, 120),
    kepalaMadrasahNip: clampStr(settings.kepalaMadrasahNip, 40),
    ppkNama: clampStr(settings.ppkNama, 120),
    ppkNip: clampStr(settings.ppkNip, 40),
    bendaharaNama: clampStr(settings.bendaharaNama, 120),
    bendaharaNip: clampStr(settings.bendaharaNip, 40),
    awalanNomorSurat: clampStr(settings.awalanNomorSurat, 40),
    kodeKlasifikasiSurat: clampStr(settings.kodeKlasifikasiSurat, 40),
    logoDataUrl: clampStr(settings.logoDataUrl ?? '', 400000),
  };
}

export async function ensureWorkspaceInitialized(user: User): Promise<void> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const workspacePath = `workspaces/${uid}`;

  try {
    const userRef = doc(db, 'users', uid);
    const existingUser = await getDoc(userRef);
    const displayName = clampStr(user.displayName || user.email || 'Operator SPPD', 120);
    const email = clampStr(user.email || '', 160);

    if (!existingUser.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        displayName,
        role: 'operator',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        email,
        displayName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  try {
    const wsRef = doc(db, 'workspaces', uid);
    const existingWs = await getDoc(wsRef);
    if (!existingWs.exists()) {
      await setDoc(wsRef, {
        ownerId: uid,
        namaMadrasah: DEFAULT_SEED_DATA.settings.namaMadrasah,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Seed settings and pegawai in first batch after workspace exists
      const batch1 = writeBatch(db);
      const settingsRef = doc(db, 'workspaces', uid, 'settings', 'instansi');
      batch1.set(settingsRef, {
        ...buildSettingsDoc(uid, DEFAULT_SEED_DATA.settings),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const peg of DEFAULT_SEED_DATA.pegawai) {
        const pegRef = doc(db, 'workspaces', uid, 'pegawai', peg.id);
        batch1.set(pegRef, {
          id: peg.id,
          ownerId: uid,
          nama: clampStr(peg.nama, 150),
          nip: clampStr(peg.nip, 40),
          pangkatGolongan: clampStr(peg.pangkatGolongan, 80),
          jabatan: clampStr(peg.jabatan, 150),
          tingkatBiaya: peg.tingkatBiaya,
          statusKepegawaian: peg.statusKepegawaian,
          unitKerja: clampStr(peg.unitKerja, 150),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch1.commit();

      // Seed SPPD records after pegawai documents exist
      const batch2 = writeBatch(db);
      for (const rec of DEFAULT_SEED_DATA.sppd) {
        const sppdRef = doc(db, 'workspaces', uid, 'sppd', rec.id);
        batch2.set(sppdRef, {
          id: rec.id,
          ownerId: uid,
          nomorSppd: clampStr(rec.nomorSppd, 100),
          nomorSuratTugas: clampStr(rec.nomorSuratTugas, 100),
          tanggalSurat: rec.tanggalSurat,
          pegawaiId: rec.pegawaiId,
          pegawaiNama: clampStr(rec.pegawaiNama, 150),
          pegawaiNip: clampStr(rec.pegawaiNip, 40),
          pegawaiPangkat: clampStr(rec.pegawaiPangkat, 80),
          pegawaiJabatan: clampStr(rec.pegawaiJabatan, 150),
          tingkatBiaya: rec.tingkatBiaya,
          maksudPerjalanan: clampStr(rec.maksudPerjalanan, 1000),
          dasarSurat: clampStr(rec.dasarSurat, 500),
          alatAngkut: clampStr(rec.alatAngkut, 120),
          tempatBerangkat: clampStr(rec.tempatBerangkat, 200),
          tempatTujuan: clampStr(rec.tempatTujuan, 200),
          instansiTujuan: clampStr(rec.instansiTujuan, 200),
          tanggalBerangkat: rec.tanggalBerangkat,
          tanggalKembali: rec.tanggalKembali,
          lamaHari: Math.max(1, Math.min(365, Math.trunc(rec.lamaHari))),
          pengikut: sanitizePengikut(rec.pengikut),
          sumberDana: clampStr(rec.sumberDana, 200),
          mataAnggaran: clampStr(rec.mataAnggaran, 100),
          keteranganLain: clampStr(rec.keteranganLain, 500),
          pejabatMengetahuiTujuan: clampStr(rec.pejabatMengetahuiTujuan, 200),
          status: rec.status,
          laporanRingkas: clampStr(rec.laporanRingkas, 2000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch2.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, workspacePath);
  }
}

export function subscribeWorkspace(
  uid: string,
  callbacks: {
    onSettings: (settings: InstansiSettings) => void;
    onPegawai: (pegawai: Pegawai[]) => void;
    onSppd: (sppd: SppdRecord[]) => void;
    onError: (err: Error) => void;
  },
): Unsubscribe {
  const settingsPath = `workspaces/${uid}/settings/instansi`;
  const pegawaiPath = `workspaces/${uid}/pegawai`;
  const sppdPath = `workspaces/${uid}/sppd`;

  const unsubSettings = onSnapshot(
    doc(db, 'workspaces', uid, 'settings', 'instansi'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        callbacks.onSettings({
          ...DEFAULT_SEED_DATA.settings,
          ...(data as Partial<InstansiSettings>),
          logoDataUrl:
            typeof data.logoDataUrl === 'string' && data.logoDataUrl.length > 0
              ? data.logoDataUrl
              : undefined,
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, settingsPath);
      } catch (e) {
        callbacks.onError(e as Error);
      }
    },
  );

  const unsubPegawai = onSnapshot(
    query(collection(db, 'workspaces', uid, 'pegawai'), where('ownerId', '==', uid)),
    (snap) => {
      const list: Pegawai[] = snap.docs.map((d) => {
        const data = d.data() as Partial<Pegawai>;
        return {
          id: d.id,
          nama: data.nama || '',
          nip: data.nip || '-',
          pangkatGolongan: data.pangkatGolongan || '-',
          jabatan: data.jabatan || '',
          tingkatBiaya: data.tingkatBiaya || 'C',
          statusKepegawaian: data.statusKepegawaian || 'PNS',
          unitKerja: data.unitKerja || 'MTsN 6 Ciamis',
        };
      });
      list.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
      callbacks.onPegawai(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, pegawaiPath);
      } catch (e) {
        callbacks.onError(e as Error);
      }
    },
  );

  const unsubSppd = onSnapshot(
    query(collection(db, 'workspaces', uid, 'sppd'), where('ownerId', '==', uid)),
    (snap) => {
      const list: SppdRecord[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          nomorSppd: String(data.nomorSppd || ''),
          nomorSuratTugas: String(data.nomorSuratTugas || ''),
          tanggalSurat: String(data.tanggalSurat || ''),
          pegawaiId: String(data.pegawaiId || ''),
          pegawaiNama: String(data.pegawaiNama || ''),
          pegawaiNip: String(data.pegawaiNip || ''),
          pegawaiPangkat: String(data.pegawaiPangkat || ''),
          pegawaiJabatan: String(data.pegawaiJabatan || ''),
          tingkatBiaya: (data.tingkatBiaya as SppdRecord['tingkatBiaya']) || 'C',
          maksudPerjalanan: String(data.maksudPerjalanan || ''),
          dasarSurat: String(data.dasarSurat || ''),
          alatAngkut: String(data.alatAngkut || 'Angkutan Umum'),
          tempatBerangkat: String(data.tempatBerangkat || ''),
          tempatTujuan: String(data.tempatTujuan || ''),
          instansiTujuan: String(data.instansiTujuan || ''),
          tanggalBerangkat: String(data.tanggalBerangkat || ''),
          tanggalKembali: String(data.tanggalKembali || ''),
          lamaHari: Number(data.lamaHari || 1),
          pengikut: sanitizePengikut(data.pengikut),
          sumberDana: String(data.sumberDana || ''),
          mataAnggaran: String(data.mataAnggaran || ''),
          keteranganLain: String(data.keteranganLain || '-'),
          pejabatMengetahuiTujuan: String(data.pejabatMengetahuiTujuan || ''),
          biaya: EMPTY_BIAYA,
          totalBiaya: 0,
          status: (data.status as SppdStatus) || 'Draft',
          laporanRingkas: String(data.laporanRingkas || ''),
          createdAt: tsToIso(data.createdAt),
          updatedAt: tsToIso(data.updatedAt),
        };
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callbacks.onSppd(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, sppdPath);
      } catch (e) {
        callbacks.onError(e as Error);
      }
    },
  );

  return () => {
    unsubSettings();
    unsubPegawai();
    unsubSppd();
  };
}

export async function saveSettingsInFirestore(
  uid: string,
  settings: InstansiSettings,
): Promise<void> {
  const path = `workspaces/${uid}/settings/instansi`;
  try {
    await updateDoc(doc(db, 'workspaces', uid, 'settings', 'instansi'), {
      ...buildSettingsDoc(uid, settings),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function savePegawaiInFirestore(
  uid: string,
  payload: Partial<Pegawai>,
  editId?: string,
): Promise<void> {
  if (!payload.nama?.trim() || !payload.jabatan?.trim()) {
    throw new Error('Nama dan Jabatan pegawai wajib diisi.');
  }

  const id = editId || `peg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `workspaces/${uid}/pegawai/${id}`;
  const docData = {
    nama: clampStr(payload.nama, 150),
    nip: clampStr(payload.nip, 40) || '-',
    pangkatGolongan: clampStr(payload.pangkatGolongan, 80) || '-',
    jabatan: clampStr(payload.jabatan, 150),
    tingkatBiaya: payload.tingkatBiaya || 'C',
    statusKepegawaian: payload.statusKepegawaian || 'PNS',
    unitKerja: clampStr(payload.unitKerja, 150) || 'MTsN 6 Ciamis',
    updatedAt: serverTimestamp(),
  };

  try {
    if (editId) {
      await updateDoc(doc(db, 'workspaces', uid, 'pegawai', id), docData);
    } else {
      await setDoc(doc(db, 'workspaces', uid, 'pegawai', id), {
        id,
        ownerId: uid,
        ...docData,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, editId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deletePegawaiInFirestore(uid: string, id: string): Promise<void> {
  const path = `workspaces/${uid}/pegawai/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', uid, 'pegawai', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSppdInFirestore(
  uid: string,
  payload: Partial<SppdRecord>,
  pegawaiList: Pegawai[],
  settings: InstansiSettings,
  editId?: string,
): Promise<void> {
  const errors = validateSppdInput({
    nomorSppd: String(payload.nomorSppd || ''),
    nomorSuratTugas: String(payload.nomorSuratTugas || ''),
    tanggalSurat: String(payload.tanggalSurat || ''),
    pegawaiId: String(payload.pegawaiId || ''),
    maksudPerjalanan: String(payload.maksudPerjalanan || ''),
    tempatBerangkat: String(payload.tempatBerangkat || ''),
    tempatTujuan: String(payload.tempatTujuan || ''),
    tanggalBerangkat: String(payload.tanggalBerangkat || ''),
    tanggalKembali: String(payload.tanggalKembali || ''),
  });

  if (Object.keys(errors).length > 0) {
    throw new Error('Validasi data SPPD gagal.');
  }

  const pegawai = pegawaiList.find((p) => p.id === payload.pegawaiId);
  if (!pegawai) {
    throw new Error('Data pegawai tidak ditemukan.');
  }

  const lamaHari = Math.max(
    1,
    Math.min(
      365,
      calculateDurationDays(
        String(payload.tanggalBerangkat),
        String(payload.tanggalKembali),
      ),
    ),
  );

  const id = editId || `sppd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `workspaces/${uid}/sppd/${id}`;
  const docData = {
    nomorSppd: clampStr(payload.nomorSppd, 100),
    nomorSuratTugas: clampStr(payload.nomorSuratTugas, 100),
    tanggalSurat: String(payload.tanggalSurat),
    pegawaiId: pegawai.id,
    pegawaiNama: clampStr(pegawai.nama, 150),
    pegawaiNip: clampStr(pegawai.nip, 40),
    pegawaiPangkat: clampStr(pegawai.pangkatGolongan, 80),
    pegawaiJabatan: clampStr(pegawai.jabatan, 150),
    tingkatBiaya: payload.tingkatBiaya || pegawai.tingkatBiaya,
    maksudPerjalanan: clampStr(payload.maksudPerjalanan, 1000),
    dasarSurat: clampStr(payload.dasarSurat || '', 500),
    alatAngkut: clampStr(payload.alatAngkut || 'Angkutan Umum', 120),
    tempatBerangkat: clampStr(payload.tempatBerangkat, 200),
    tempatTujuan: clampStr(payload.tempatTujuan, 200),
    instansiTujuan: clampStr(payload.instansiTujuan || payload.tempatTujuan, 200),
    tanggalBerangkat: String(payload.tanggalBerangkat),
    tanggalKembali: String(payload.tanggalKembali),
    lamaHari,
    pengikut: sanitizePengikut(payload.pengikut),
    sumberDana: clampStr(payload.sumberDana || `DIPA ${settings.namaMadrasah}`, 200),
    mataAnggaran: clampStr(payload.mataAnggaran || '524111', 100),
    keteranganLain: clampStr(payload.keteranganLain || '-', 500),
    pejabatMengetahuiTujuan: clampStr(payload.pejabatMengetahuiTujuan || '', 200),
    status: (payload.status as SppdStatus) || 'Draft',
    laporanRingkas: clampStr(payload.laporanRingkas || '', 2000),
    updatedAt: serverTimestamp(),
  };

  try {
    if (editId) {
      await updateDoc(doc(db, 'workspaces', uid, 'sppd', id), docData);
    } else {
      await setDoc(doc(db, 'workspaces', uid, 'sppd', id), {
        id,
        ownerId: uid,
        ...docData,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, editId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function updateSppdStatusInFirestore(
  uid: string,
  id: string,
  status: SppdStatus,
): Promise<void> {
  const path = `workspaces/${uid}/sppd/${id}`;
  try {
    await updateDoc(doc(db, 'workspaces', uid, 'sppd', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSppdInFirestore(uid: string, id: string): Promise<void> {
  const path = `workspaces/${uid}/sppd/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', uid, 'sppd', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
