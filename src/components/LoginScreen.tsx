import React, { useState } from 'react';
import { 
  Coffee, 
  Wifi, 
  ShieldCheck, 
  UserCheck, 
  ChefHat, 
  Delete, 
  ArrowRight,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '../types/pos';
import { DEMO_USERS } from '../data/mockProducts';
import { soundManager } from '../utils/audio';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);

  const handleKeyPress = (digit: string) => {
    if (isAutoFilling) return;
    soundManager.playClick();
    setErrorMessage('');
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      
      // Auto-check PIN when 4 digits reached
      if (nextPin.length === 4) {
        checkPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isAutoFilling) return;
    soundManager.playClick();
    setErrorMessage('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isAutoFilling) return;
    soundManager.playClick();
    setErrorMessage('');
    setPinInput('');
  };

  const checkPin = (code: string) => {
    const matched = DEMO_USERS.find((u) => u.pin === code);
    if (matched) {
      soundManager.playSuccess();
      onLoginSuccess(matched);
    } else {
      soundManager.playAlert();
      setErrorMessage('PIN Kasir tidak valid. Gunakan PIN demo (1111, 2222, 3333).');
      setPinInput('');
    }
  };

  const handleQuickDemoLogin = (user: UserAccount) => {
    if (isAutoFilling) return;
    setIsAutoFilling(true);
    setErrorMessage('');
    setPinInput('');

    // Smooth auto-fill simulation showing tactile PIN feedback
    const digits = user.pin.split('');
    digits.forEach((digit, index) => {
      setTimeout(() => {
        soundManager.playClick();
        setPinInput((prev) => prev + digit);
        if (index === digits.length - 1) {
          setTimeout(() => {
            soundManager.playSuccess();
            setIsAutoFilling(false);
            onLoginSuccess(user);
          }, 200);
        }
      }, (index + 1) * 90);
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto bg-stone-950 relative select-none">
      {/* Decorative ambient glowing warm coffee accents */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Responsive & Fully Scrollable */}
      <div className="my-auto max-h-[90vh] overflow-y-auto custom-scrollbar w-full max-w-md bg-stone-900/95 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative z-10 backdrop-blur-xl animate-fadeIn">
        {/* Brand Lockup with Bear Mascot Logo & Official Tagline */}
        <div className="flex flex-col items-center mb-1">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#f5ede4] p-1.5 shadow-xl shadow-stone-950/50 border-2 border-stone-700/60 flex items-center justify-center overflow-hidden mb-2.5 group hover:scale-105 transition-transform duration-300">
            <img 
              src="/assets/aistudio/extra-large_4af77947.png" 
              alt="Ridex Cafe Bear Mascot Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-50 text-center font-sans">
            RIDEX CAFE
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-amber-400 tracking-[0.22em] uppercase text-center mt-0.5">
            YOUR DAILY ESCAPE
          </p>
        </div>

        {/* System Online Badge */}
        <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/80 border border-stone-800 text-[11px] text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Smart POS &amp; Multi-Role System · Cilacap Outlet Online</span>
        </div>

        {/* PIN Display & Masked Dots */}
        <div className="w-full mt-5 flex flex-col items-center">
          <div className="text-xs text-stone-400 font-medium mb-2.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Masukkan PIN Kasir / Pegawai:</span>
          </div>

          <div className="flex items-center justify-center gap-3 h-9">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                      : 'border-2 border-stone-700 bg-stone-950/60'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage && (
            <div className="mt-2.5 text-xs text-rose-400 flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Visual Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-2 mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              disabled={isAutoFilling}
              onClick={() => handleKeyPress(digit)}
              className="h-11 rounded-xl bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-base font-bold font-mono text-amber-50 hover:text-amber-400 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {digit}
            </button>
          ))}

          <button
            disabled={isAutoFilling}
            onClick={handleClear}
            className="h-11 rounded-xl bg-stone-950/40 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-400 transition-all active:scale-95 disabled:opacity-50"
          >
            Hapus
          </button>

          <button
            disabled={isAutoFilling}
            onClick={() => handleKeyPress('0')}
            className="h-11 rounded-xl bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-base font-bold font-mono text-amber-50 hover:text-amber-400 transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            0
          </button>

          <button
            disabled={isAutoFilling}
            onClick={handleDelete}
            className="h-11 rounded-xl bg-stone-950/40 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-rose-400 transition-all active:scale-95 disabled:opacity-50"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Login Section */}
        <div className="w-full mt-5 pt-4 border-t border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block text-center mb-2.5">
            AKSES CEPAT DEMO PENGGUNA:
          </span>

          <div className="space-y-2">
            {/* Owner Button (Warm Amber) */}
            <button
              disabled={isAutoFilling}
              onClick={() => handleQuickDemoLogin(DEMO_USERS[0])}
              className="w-full p-2.5 rounded-xl bg-stone-950 hover:bg-amber-950/40 border border-amber-600/40 hover:border-amber-500 flex items-center justify-between text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-100 block group-hover:text-amber-300">
                    🟢 [Login sebagai Pemilik / Owner]
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-mono">
                    ➔ (PIN Auto-fill: 1111) · Rifqy Ridho P. (Owner &amp; Analitik)
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Cashier Button */}
            <button
              disabled={isAutoFilling}
              onClick={() => handleQuickDemoLogin(DEMO_USERS[1])}
              className="w-full p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/60 flex items-center justify-between text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-200 block group-hover:text-amber-300">
                    🔵 [Login sebagai Kasir / Cashier]
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ➔ (PIN Auto-fill: 2222) · Rifqy Ridho P. (POS Kasir)
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Kitchen Button */}
            <button
              disabled={isAutoFilling}
              onClick={() => handleQuickDemoLogin(DEMO_USERS[2])}
              className="w-full p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/60 flex items-center justify-between text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-200 block group-hover:text-amber-300">
                    🟠 [Login sebagai Dapur / Kitchen (KDS)]
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ➔ (PIN Auto-fill: 3333) · Chef Dapur (Tiket Pesanan)
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-stone-500 mt-4 text-center">
          Loka F&amp;B POS Engine · Ridex Cafe Architecture v2.5
        </p>
      </div>
    </div>
  );
};
