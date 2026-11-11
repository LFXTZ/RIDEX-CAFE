import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Bell, 
  Utensils, 
  ShoppingBag, 
  Filter, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { KitchenTicket, KitchenStatus } from '../types/pos';
import { soundManager } from '../utils/audio';

interface KitchenDisplayProps {
  tickets: KitchenTicket[];
  onUpdateTicketStatus: (ticketId: string, nextStatus: KitchenStatus) => void;
  onClearCompletedTickets: () => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  tickets,
  onUpdateTicketStatus,
  onClearCompletedTickets,
}) => {
  const [filterStatus, setFilterStatus] = useState<KitchenStatus | 'all'>('all');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());

  // Update timer every 5 seconds for elapsed minute tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filtered tickets (hide completed unless 'all')
  const visibleTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return t.status !== 'completed';
    return t.status === filterStatus;
  });

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const cookingCount = tickets.filter((t) => t.status === 'cooking').length;
  const readyCount = tickets.filter((t) => t.status === 'ready').length;
  const overdueCount = tickets.filter(
    (t) => t.status !== 'completed' && (currentTimeMs - t.createdAt) > 10 * 60 * 1000
  ).length;

  const handleProgressTicket = (ticket: KitchenTicket) => {
    soundManager.playClick();
    if (ticket.status === 'pending') {
      onUpdateTicketStatus(ticket.id, 'cooking');
    } else if (ticket.status === 'cooking') {
      soundManager.playSuccess();
      onUpdateTicketStatus(ticket.id, 'ready');
    } else if (ticket.status === 'ready') {
      soundManager.playCashDrawer();
      onUpdateTicketStatus(ticket.id, 'completed');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-950 text-amber-50 overflow-hidden select-none">
      {/* KDS Control Ribbon */}
      <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              soundManager.playClick();
              setFilterStatus('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Semua Antrean ({pendingCount + cookingCount + readyCount})
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setFilterStatus('pending');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pesanan Baru ({pendingCount})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setFilterStatus('cooking');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filterStatus === 'cooking'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Sedang Dimasak ({cookingCount})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setFilterStatus('ready');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filterStatus === 'ready'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Siap Disajikan ({readyCount})</span>
          </button>
        </div>

        {/* KDS Metric Strip */}
        <div className="flex items-center gap-3 text-xs">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{overdueCount} Tiket &gt; 10 Menit!</span>
            </div>
          )}

          <div className="text-stone-400 font-mono text-[11px]">
            Target Penyajian: <strong className="text-amber-400">&lt; 8 Menit</strong>
          </div>
        </div>
      </div>

      {/* Grid of Kitchen Tickets */}
      <div className="flex-1 overflow-y-auto p-4">
        {visibleTickets.length === 0 ? (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 mb-3">
              <ChefHat className="w-8 h-8 text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-amber-50 mb-1">Dapur Bersih &amp; Tidak Ada Antrean</h4>
            <p className="text-xs text-stone-400 max-w-sm">
              Semua pesanan pelanggan telah selesai diproduksi. Pesanan baru dari kasir akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleTickets.map((ticket) => {
              const elapsedMinutes = Math.floor((currentTimeMs - ticket.createdAt) / 60000);
              const elapsedSeconds = Math.floor(((currentTimeMs - ticket.createdAt) % 60000) / 1000);

              // Timer Alert Color Scheme
              let timerBg = 'bg-stone-950 border-stone-700 text-stone-300';
              let cardBorder = 'border-stone-800';

              if (elapsedMinutes >= 10) {
                timerBg = 'bg-rose-950/90 border-rose-500/80 text-rose-300 animate-pulse';
                cardBorder = 'border-rose-500/60 ring-1 ring-rose-500/40';
              } else if (elapsedMinutes >= 5) {
                timerBg = 'bg-amber-950/80 border-amber-500/60 text-amber-300';
                cardBorder = 'border-amber-500/40';
              }

              // Status badge
              let statusText = 'Pesanan Baru';
              let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
              let nextActionText = 'Mulai Masak';
              let nextActionColor = 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold';

              if (ticket.status === 'cooking') {
                statusText = 'Sedang Dimasak';
                statusColor = 'text-amber-300 bg-amber-950/60 border-amber-600/40';
                nextActionText = 'Tandai Siap Saji';
                nextActionColor = 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold';
              } else if (ticket.status === 'ready') {
                statusText = 'Siap Disajikan';
                statusColor = 'text-amber-200 bg-amber-950/80 border-amber-400/50';
                nextActionText = 'Sajikan & Selesai';
                nextActionColor = 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/40';
              }

              return (
                <div
                  key={ticket.id}
                  className={`bg-stone-900 rounded-2xl border ${cardBorder} shadow-lg flex flex-col justify-between overflow-hidden transition-all`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-stone-950/90 border-b border-stone-800 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-amber-50">
                          {ticket.orderNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-stone-800 text-stone-300">
                          {ticket.orderType === 'dine_in' ? `MEJA ${ticket.tableNumber || '01'}` : 'TAKEAWAY'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {ticket.customerName || 'Tamu'} · {ticket.timestamp}
                      </div>
                    </div>

                    {/* Order Timer Display */}
                    <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 ${timerBg}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMinutes.toString().padStart(2, '0')}:{elapsedSeconds.toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[300px]">
                    {ticket.items.map((item, idx) => {
                      const hasNotes = item.notes && item.notes.trim().length > 0;

                      return (
                        <div key={idx} className="pb-2.5 border-b border-stone-800/80 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-stone-100 leading-snug">
                              <strong className="text-amber-400 font-mono text-base mr-1.5">{item.quantity}x</strong>
                              {item.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 shrink-0">
                              {item.size}
                            </span>
                          </div>

                          {/* Modifiers & Extras */}
                          <div className="text-xs text-stone-400 pl-6 mt-0.5 space-y-0.5">
                            {item.sugarLevel !== '100%' && (
                              <div>Gula: <span className="text-amber-300 font-medium">{item.sugarLevel}</span></div>
                            )}
                            {item.iceLevel !== 'Normal' && (
                              <div>Es: <span className="text-stone-300 font-medium">{item.iceLevel}</span></div>
                            )}
                            {item.extras.map((e, i) => (
                              <div key={i} className="text-stone-300">+{e.name}</div>
                            ))}
                            {hasNotes && (
                              <div className="mt-1 text-xs font-semibold text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-500/30">
                                Catatan: &ldquo;{item.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer Action */}
                  <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md border ${statusColor}`}>
                      {statusText}
                    </span>

                    <button
                      onClick={() => handleProgressTicket(ticket)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md ${nextActionColor}`}
                    >
                      <span>{nextActionText}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
