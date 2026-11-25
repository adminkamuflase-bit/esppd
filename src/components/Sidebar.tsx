import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  X,
  LogIn,
  LogOut,
} from 'lucide-react';
import { KemenagCrest } from './KemenagCrest';

export type ActiveTab = 'dashboard' | 'sppd' | 'pegawai' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  madrasahName: string;
  tahunAnggaran: string;
  logoDataUrl?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userLabel?: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'sppd', label: 'Daftar SPPD', icon: FileText },
  { id: 'pegawai', label: 'Data Pegawai', icon: Users },
  { id: 'settings', label: 'Pengaturan Instansi', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  madrasahName,
  tahunAnggaran,
  logoDataUrl,
  mobileOpen,
  onCloseMobile,
  userLabel,
  onSignIn,
  onSignOut,
}) => {
  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt={`Logo ${madrasahName}`}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-md object-contain"
              />
            ) : (
              <KemenagCrest className="h-9 w-9 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-display text-sm font-bold tracking-tight text-slate-900 truncate">
                {madrasahName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                Administrasi SPPD · TA {tahunAnggaran}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu navigasi"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navigasi Utama" className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-emerald-800' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 px-4 py-4 space-y-3">
        <div className="md:hidden">
          {userLabel ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="truncate font-medium">{userLabel}</span>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onCloseMobile();
                }}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSignIn();
                onCloseMobile();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogIn className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Masuk Google</span>
            </button>
          )}
        </div>
        <div className="px-1">
          <p className="text-xs font-medium text-slate-700">Kementerian Agama RI</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Kabupaten Ciamis · Jawa Barat
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-64 shrink-0 no-print">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full">{navContent}</aside>
        </div>
      )}
    </>
  );
};
