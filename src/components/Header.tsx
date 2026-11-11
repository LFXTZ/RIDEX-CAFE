import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Wifi, 
  Clock, 
  Bookmark, 
  LayoutGrid, 
  BarChart3, 
  Receipt, 
  Volume2, 
  VolumeX, 
  Maximize2,
  DollarSign,
  ChefHat,
  ShieldCheck,
  UserCheck,
  LogOut,
  User
} from 'lucide-react';
import { UserRole, UserAccount } from '../types/pos';
import { formatRupiah, formatTimeOnly } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  currentUser: UserAccount;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  drawerCash: number;
  holdCount: number;
  activeKitchenTicketsCount: number;
  onOpenHoldModal: () => void;
  onOpenTableModal: () => void;
  onOpenShiftModal: () => void;
  onOpenHistoryModal: () => void;
  onRequestLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  drawerCash,
  holdCount,
  activeKitchenTicketsCount,
  onOpenHoldModal,
  onOpenTableModal,
  onOpenShiftModal,
  onOpenHistoryModal,
  onRequestLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(formatTimeOnly());
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTimeOnly());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const nextState = soundManager.toggleMute();
    setIsMuted(nextState);
    if (!nextState) {
      soundManager.playClick();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSelectRole = (role: UserRole) => {
    soundManager.playClick();
    onRoleChange(role);
  };

  return (
    <header className="h-16 px-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-3 select-none shrink-0 z-30">
      {/* Brand & Outlet Info with Bear Mascot Logo & Official Tagline */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#f5ede4] p-1 shadow-md border border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
          <img 
            src="/assets/aistudio/extra-large_4af77947.png" 
            alt="Ridex Cafe Bear Mascot" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-tight text-amber-50 uppercase font-sans">RIDEX CAFE</span>
            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 hidden sm:inline-block">
              YOUR DAILY ESCAPE
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            {currentRole === 'kitchen' ? (
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <ChefHat className="w-3 h-3 text-amber-400 inline" />
                Layar Dapur Aktif · {activeKitchenTicketsCount} Antrean
              </span>
            ) : currentRole === 'owner' ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <ShieldCheck className="w-3 h-3 text-amber-400 inline" />
                Mode Pemilik · Akses Analitik Penuh
              </span>
            ) : (
              <>
                <span>Shift: <strong className="text-stone-200 font-medium">{currentUser.name}</strong></span>
                <span className="text-stone-600">·</span>
                <span className="flex items-center gap-1 text-amber-400 font-mono">
                  <DollarSign className="w-3 h-3 text-amber-500 inline" />
                  {formatRupiah(drawerCash)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: ROLE SWITCHER (For Owner: can switch views freely; for Cashier/Kitchen: displays active role badge) */}
      <div className="relative">
        {currentUser.role === 'owner' ? (
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => handleSelectRole('owner')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'owner'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pemilik</span>
            </button>

            <button
              onClick={() => handleSelectRole('cashier')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'cashier'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kasir (POS)</span>
            </button>

            <button
              onClick={() => handleSelectRole('kitchen')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'kitchen'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dapur (KDS)</span>
              {activeKitchenTicketsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-950 text-amber-300 text-[10px] font-mono font-bold rounded-full">
                  {activeKitchenTicketsCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-stone-950 px-3.5 py-1.5 rounded-xl border border-stone-800">
            {currentUser.role === 'cashier' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Mode Kasir Operasional</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Mode Produksi Layar Dapur (KDS)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: User Profile, Shortcuts, and LOG OUT Button */}
      <div className="flex items-center gap-2 shrink-0">
        {currentRole === 'cashier' && (
          <>
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenHoldModal();
              }}
              className="relative px-3 py-2 text-xs font-medium text-amber-100 bg-stone-800 hover:bg-stone-750 rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Daftar Pesanan Tersimpan (Hold Orders)"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Hold</span>
              {holdCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded-full border border-amber-500/30">
                  {holdCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenTableModal();
              }}
              className="px-3 py-2 text-xs font-medium text-amber-100 bg-stone-800 hover:bg-stone-750 rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Peta Denah Meja & Status Reservasi"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Peta Meja</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenShiftModal();
              }}
              className="px-3 py-2 text-xs font-medium text-amber-100 bg-stone-800 hover:bg-stone-750 rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Laporan Kasir & Rekap Shift Harian"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Rekap</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenHistoryModal();
              }}
              className="px-3 py-2 text-xs font-medium text-amber-100 bg-stone-800 hover:bg-stone-750 rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Riwayat Transaksi & Cetak Ulang Struk"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Struk</span>
            </button>
          </>
        )}

        {/* User Account Profile Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
          <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-amber-400">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-amber-50 block leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* LOG OUT BUTTON */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRequestLogout();
          }}
          className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Keluar dari Sesi Akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>

        {/* Mute/Sound Toggle */}
        <button
          onClick={toggleSound}
          className="p-2 text-stone-400 hover:text-amber-200 hover:bg-stone-800 rounded-lg transition-colors"
          title={isMuted ? 'Nyalakan Efek Suara POS' : 'Matikan Suara POS'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-stone-300" />}
        </button>
      </div>
    </header>
  );
};
