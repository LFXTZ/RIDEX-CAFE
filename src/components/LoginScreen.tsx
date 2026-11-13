import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  AlertCircle,
  Camera,
  X
} from 'lucide-react';
import { UserAccount } from '../types/pos';
import { DEMO_USERS } from '../data/mockProducts';
import { soundManager } from '../utils/audio';

export interface CustomerPayParams {
  orderId: string;
  amount: number;
  tableNumber: string;
  customerName?: string;
  rawItems?: string;
}

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onEnterCustomerPay?: (params: CustomerPayParams) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onEnterCustomerPay }) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerStatus, setScannerStatus] = useState<string>('Arahkan kotak QRIS Ridex Cafe ke kamera perangkat Anda.');
  const [cameraError, setCameraError] = useState<string>('');
  const [manualQrUrl, setManualQrUrl] = useState<string>('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

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

  const stopCameraScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      } finally {
        qrScannerRef.current = null;
      }
    }
  };

  const processScannedQrText = (rawText: string) => {
    soundManager.playSuccess();
    void stopCameraScanner();
    setIsScannerOpen(false);

    let parsedUrl: URL | null = null;
    try {
      if (rawText.startsWith('?')) {
        parsedUrl = new URL(window.location.origin + window.location.pathname + rawText);
      } else {
        parsedUrl = new URL(rawText);
      }
    } catch {
      const qIdx = rawText.indexOf('?');
      if (qIdx !== -1) {
        try {
          parsedUrl = new URL(window.location.origin + window.location.pathname + rawText.slice(qIdx));
        } catch {}
      }
    }

    if (
      parsedUrl &&
      (parsedUrl.searchParams.get('pay') === '1' || parsedUrl.searchParams.get('mode') === 'customer-pay')
    ) {
      const params: CustomerPayParams = {
        orderId: parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('orderId') || 'RDX-998877',
        amount: parseInt(parsedUrl.searchParams.get('amt') || parsedUrl.searchParams.get('amount') || '45000', 10),
        tableNumber: parsedUrl.searchParams.get('tbl') || parsedUrl.searchParams.get('table') || '04',
        customerName: parsedUrl.searchParams.get('cust') || parsedUrl.searchParams.get('customer') || '',
        rawItems: parsedUrl.searchParams.get('items') || '',
      };
      if (onEnterCustomerPay) {
        onEnterCustomerPay(params);
      } else {
        window.location.href = parsedUrl.toString();
      }
    } else if (parsedUrl) {
      window.location.href = parsedUrl.toString();
    } else {
      setIsScannerOpen(true);
      setScannerStatus('Format QR / Link tidak dikenali sebagai tagihan Ridex Cafe.');
    }
  };

  useEffect(() => {
    if (!isScannerOpen) {
      void stopCameraScanner();
      return;
    }

    let isMounted = true;
    setCameraError('');
    setScannerStatus('Mengaktifkan kamera perangkat...');

    const startScanner = async () => {
      try {
        await new Promise((r) => setTimeout(r, 150));
        if (!isMounted) return;
        const scanner = new Html5Qrcode('react-qr-live-reader');
        qrScannerRef.current = scanner;

        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 210, height: 210 } },
            (decodedText) => processScannedQrText(decodedText),
            () => {}
          );
          if (isMounted) setScannerStatus('Kamera aktif! Arahkan ke QRIS Ridex Cafe.');
        } catch {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0 && isMounted) {
            await scanner.start(
              devices[0].id,
              { fps: 10, qrbox: { width: 210, height: 210 } },
              (decodedText) => processScannedQrText(decodedText),
              () => {}
            );
            if (isMounted) setScannerStatus('Webcam aktif! Arahkan ke QRIS Ridex Cafe.');
          } else {
            throw new Error('No camera available');
          }
        }
      } catch {
        if (isMounted) {
          setCameraError('Izin kamera belum diberikan atau kamera tidak terdeteksi. Gunakan kolom tempel link di bawah.');
          setScannerStatus('Silakan tempel link pembayaran QRIS secara manual di bawah.');
        }
      }
    };

    void startScanner();

    return () => {
      isMounted = false;
      void stopCameraScanner();
    };
  }, [isScannerOpen]);

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualQrUrl.trim();
    if (!trimmed) {
      soundManager.playAlert();
      setScannerStatus('Mohon tempel link pembayaran QRIS terlebih dahulu.');
      return;
    }
    processScannedQrText(trimmed);
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

        {/* Cross-Device Customer Scan QR Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setManualQrUrl('');
            setIsScannerOpen(true);
          }}
          className="mt-3 px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          title="Pindai QR Pembayaran Pelanggan via Kamera HP, Tablet, Laptop, atau PC"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Scan QR Pembayaran</span>
        </button>

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

      {/* Live QR Scanner Modal (Camera + Manual Link Paste Fallback) */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Scan QR Pembayaran</h3>
                  <p className="text-[11px] text-stone-400">Kamera HP, Tablet, Webcam Laptop/PC, atau tempel link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsScannerOpen(false);
                }}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="w-full min-h-[240px] bg-stone-950 border border-stone-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                  <div id="react-qr-live-reader" className="w-full" />
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-stone-950/95 space-y-1">
                      <p className="text-xs font-semibold text-amber-400">{cameraError}</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-center text-stone-400 font-medium">{scannerStatus}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                <div className="h-px flex-1 bg-stone-800" />
                <span>Atau Tempel Link Pembayaran</span>
                <div className="h-px flex-1 bg-stone-800" />
              </div>

              <form onSubmit={handleManualUrlSubmit} className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 block">Link Pembayaran QRIS:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualQrUrl}
                    onChange={(e) => setManualQrUrl(e.target.value)}
                    placeholder="Tempel link ?pay=1&id=RDX-... di sini"
                    className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl text-xs whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                  >
                    Buka Bayar →
                  </button>
                </div>
              </form>
            </div>

            <div className="p-3 bg-stone-950/60 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsScannerOpen(false);
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
