import React, { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, Menu, Plus } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import type {
  AppDatabase,
  InstansiSettings,
  Pegawai,
  SppdRecord,
  SppdStatus,
} from './types/sppd';
import { DEFAULT_SEED_DATA } from './data/seedData';
import { auth, googleAuthProvider } from './lib/firebase';
import {
  deletePegawaiInFirestore,
  deleteSppdInFirestore,
  ensureWorkspaceInitialized,
  savePegawaiInFirestore,
  saveSettingsInFirestore,
  saveSppdInFirestore,
  subscribeWorkspace,
  updateSppdStatusInFirestore,
} from './services/firestoreService';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SppdListView } from './components/SppdListView';
import { PegawaiView } from './components/PegawaiView';
import { SettingsView } from './components/SettingsView';
import { SppdFormModal } from './components/SppdFormModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { ConfirmDialog } from './components/ConfirmDialog';

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Ringkasan Administrasi SPPD',
    subtitle: 'Pantau surat tugas dan perjalanan dinas MTsN 6 Ciamis',
  },
  sppd: {
    title: 'Daftar Surat Perjalanan Dinas',
    subtitle: 'Kelola penerbitan, status pelaksanaan, dan pencetakan dokumen SPPD',
  },
  pegawai: {
    title: 'Data Pegawai MTsN 6 Ciamis',
    subtitle: 'Daftar guru dan tenaga kependidikan pelaksana perjalanan dinas',
  },
  settings: {
    title: 'Pengaturan Instansi & Pejabat',
    subtitle: 'Konfigurasi kop surat resmi, kepala madrasah, dan PPK',
  },
};

export default function App() {
  const [db, setDb] = useState<AppDatabase>(DEFAULT_SEED_DATA);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SPPD Create/Edit modal state
  const [sppdFormOpen, setSppdFormOpen] = useState(false);
  const [editingSppd, setEditingSppd] = useState<SppdRecord | null>(null);

  // Print preview modal state
  const [previewRecord, setPreviewRecord] = useState<SppdRecord | null>(null);

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'sppd'; item: SppdRecord }
    | { type: 'pegawai'; item: Pegawai }
    | null
  >(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Gagal memuat data dari server.');
      const data = (await res.json()) as AppDatabase;
      setDb(data);
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!currentUser) {
      void fetchBootstrap();
      return;
    }

    let cancelled = false;
    let unsubWorkspace: (() => void) | undefined;

    const connectCloud = async () => {
      try {
        setLoading(true);
        await ensureWorkspaceInitialized(currentUser);
        if (cancelled) return;
        unsubWorkspace = subscribeWorkspace(currentUser.uid, {
          onSettings: (settings) => {
            setDb((prev) => ({ ...prev, settings }));
            setLoading(false);
          },
          onPegawai: (pegawai) => {
            setDb((prev) => ({ ...prev, pegawai }));
            setLoading(false);
          },
          onSppd: (sppd) => {
            setDb((prev) => ({ ...prev, sppd }));
            setLoading(false);
          },
          onError: (err) => {
            setErrorBanner(err.message);
            setLoading(false);
          },
        });
        setErrorBanner(null);
      } catch (err) {
        if (!cancelled) {
          setErrorBanner(
            err instanceof Error ? err.message : 'Gagal menghubungkan akun ke cloud.',
          );
          setLoading(false);
        }
      }
    };

    void connectCloud();

    return () => {
      cancelled = true;
      if (unsubWorkspace) unsubWorkspace();
    };
  }, [authReady, currentUser, fetchBootstrap]);

  const handleSignIn = async () => {
    try {
      setErrorBanner(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.',
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Gagal keluar dari akun.',
      );
    }
  };

  const handleOpenCreateSppd = () => {
    setEditingSppd(null);
    setSppdFormOpen(true);
  };

  const handleOpenEditSppd = (record: SppdRecord) => {
    setEditingSppd(record);
    setSppdFormOpen(true);
  };

  const handleSaveSppd = async (payload: Partial<SppdRecord>, editId?: string) => {
    if (currentUser) {
      await saveSppdInFirestore(currentUser.uid, payload, db.pegawai, db.settings, editId);
      return;
    }
    const url = editId ? `/api/sppd/${editId}` : '/api/sppd';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menyimpan data SPPD.');
    }
    setDb((prev) => ({
      ...prev,
      sppd: editId
        ? prev.sppd.map((item) => (item.id === editId ? (data as SppdRecord) : item))
        : [data as SppdRecord, ...prev.sppd],
    }));
  };

  const handleChangeSppdStatus = async (id: string, status: SppdStatus) => {
    if (currentUser) {
      try {
        await updateSppdStatusInFirestore(currentUser.uid, id, status);
      } catch (err) {
        setErrorBanner(
          err instanceof Error ? err.message : 'Gagal memperbarui status SPPD.',
        );
      }
      return;
    }
    const res = await fetch(`/api/sppd/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as SppdRecord;
    setDb((prev) => ({
      ...prev,
      sppd: prev.sppd.map((item) => (item.id === id ? updated : item)),
    }));
  };

  const handleSavePegawai = async (payload: Partial<Pegawai>, editId?: string) => {
    if (currentUser) {
      await savePegawaiInFirestore(currentUser.uid, payload, editId);
      return;
    }
    const url = editId ? `/api/pegawai/${editId}` : '/api/pegawai';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menyimpan data pegawai.');
    }
    setDb((prev) => ({
      ...prev,
      pegawai: editId
        ? prev.pegawai.map((p) => (p.id === editId ? (data as Pegawai) : p))
        : [...prev.pegawai, data as Pegawai],
    }));
  };

  const handleSaveSettings = async (updated: InstansiSettings) => {
    if (currentUser) {
      await saveSettingsInFirestore(currentUser.uid, updated);
      return;
    }
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Gagal menyimpan pengaturan instansi.');
    const saved = (await res.json()) as InstansiSettings;
    setDb((prev) => ({ ...prev, settings: saved }));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (currentUser) {
      try {
        if (deleteTarget.type === 'sppd') {
          await deleteSppdInFirestore(currentUser.uid, deleteTarget.item.id);
        } else {
          await deletePegawaiInFirestore(currentUser.uid, deleteTarget.item.id);
        }
      } catch (err) {
        setErrorBanner(
          err instanceof Error ? err.message : 'Gagal menghapus data.',
        );
      }
      setDeleteTarget(null);
      return;
    }

    if (deleteTarget.type === 'sppd') {
      const res = await fetch(`/api/sppd/${deleteTarget.item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDb((prev) => ({
          ...prev,
          sppd: prev.sppd.filter((item) => item.id !== deleteTarget.item.id),
        }));
      }
    } else {
      const res = await fetch(`/api/pegawai/${deleteTarget.item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDb((prev) => ({
          ...prev,
          pegawai: prev.pegawai.filter((p) => p.id !== deleteTarget.item.id),
        }));
      }
    }
    setDeleteTarget(null);
  };

  const tabMeta = TAB_TITLES[activeTab];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        madrasahName={db.settings.namaMadrasah}
        tahunAnggaran={db.settings.tahunAnggaran}
        logoDataUrl={db.settings.logoDataUrl}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userLabel={currentUser ? currentUser.displayName || currentUser.email : null}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Workspace Header */}
        <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden shrink-0"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                  {tabMeta.title}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  {tabMeta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {currentUser ? (
                <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                  <span className="max-w-[160px] truncate font-medium">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Keluar akun Google"
                    title="Keluar"
                    className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-800"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <LogIn className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>Masuk Google</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenCreateSppd}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3.5 py-2 sm:px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Buat SPPD Baru</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="no-print flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {errorBanner && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorBanner}
            </div>
          )}

          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Memuat data">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
                  />
                ))}
              </div>
              <div className="h-72 rounded-xl border border-slate-200 bg-white animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  records={db.sppd}
                  pegawaiCount={db.pegawai.length}
                  tahunAnggaran={db.settings.tahunAnggaran}
                  onCreateNew={handleOpenCreateSppd}
                  onViewAllSppd={() => setActiveTab('sppd')}
                  onPrintSppd={(rec) => setPreviewRecord(rec)}
                  onEditSppd={handleOpenEditSppd}
                />
              )}

              {activeTab === 'sppd' && (
                <SppdListView
                  records={db.sppd}
                  onCreateNew={handleOpenCreateSppd}
                  onPrintSppd={(rec) => setPreviewRecord(rec)}
                  onEditSppd={handleOpenEditSppd}
                  onChangeStatus={handleChangeSppdStatus}
                  onDeleteSppd={(item) => setDeleteTarget({ type: 'sppd', item })}
                />
              )}

              {activeTab === 'pegawai' && (
                <PegawaiView
                  pegawaiList={db.pegawai}
                  onSavePegawai={handleSavePegawai}
                  onDeletePegawai={(item) => setDeleteTarget({ type: 'pegawai', item })}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={db.settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </>
          )}
        </main>
      </div>

      <SppdFormModal
        open={sppdFormOpen}
        initialRecord={editingSppd}
        existingRecords={db.sppd}
        pegawaiList={db.pegawai}
        settings={db.settings}
        onClose={() => setSppdFormOpen(false)}
        onSave={handleSaveSppd}
      />

      <PrintPreviewModal
        record={previewRecord}
        settings={db.settings}
        onClose={() => setPreviewRecord(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.type === 'sppd'
            ? 'Hapus Data SPPD?'
            : 'Hapus Data Pegawai?'
        }
        description={
          deleteTarget?.type === 'sppd'
            ? `Apakah Anda yakin ingin menghapus SPPD nomor ${deleteTarget.item.nomorSppd} atas nama ${deleteTarget.item.pegawaiNama}?`
            : deleteTarget?.type === 'pegawai'
            ? `Apakah Anda yakin ingin menghapus data pegawai ${deleteTarget.item.nama}?`
            : ''
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
