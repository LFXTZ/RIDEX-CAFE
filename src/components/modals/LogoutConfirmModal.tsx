import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { UserAccount } from '../../types/pos';
import { soundManager } from '../../utils/audio';

interface LogoutConfirmModalProps {
  currentUser: UserAccount | null;
  onConfirmLogout: () => void;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  currentUser,
  onConfirmLogout,
  onClose,
}) => {
  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <LogOut className="w-4 h-4" />
            <span>Konfirmasi Keluar Sesi</span>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-1">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-amber-50">Keluar dari Akun?</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Sesi untuk <strong className="text-amber-100">{currentUser.name}</strong> ({currentUser.role.toUpperCase()}) akan diakhiri dan sistem akan kembali terkunci di layar Login.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={() => {
              soundManager.playAlert();
              onConfirmLogout();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40"
          >
            Keluar Akun
          </button>
        </div>
      </div>
    </div>
  );
};
