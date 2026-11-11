import React, { useState } from 'react';
import { X, LayoutGrid, CheckCircle2, Clock, Users, Coffee } from 'lucide-react';
import { TableItem } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface TableMapModalProps {
  tables: TableItem[];
  selectedTableNumber: string;
  onSelectTable: (table: TableItem) => void;
  onClose: () => void;
}

export const TableMapModal: React.FC<TableMapModalProps> = ({
  tables,
  selectedTableNumber,
  onSelectTable,
  onClose,
}) => {
  const [activeZone, setActiveZone] = useState<string>('All');

  const zones = ['All', 'Indoor Cafe', 'Bar Counter', 'Outdoor Terrace'];

  const filteredTables = tables.filter(
    (t) => activeZone === 'All' || t.zone === activeZone
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Peta Denah Meja & Status Reservasi</h3>
              <p className="text-xs text-slate-400">Ridex Cafe · Pilih meja untuk pesanan Dine-In</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend & Filter Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => {
                  soundManager.playClick();
                  setActiveZone(zone);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeZone === zone
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Kosong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Terisi / Billing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Reservasi</span>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredTables.map((table) => {
              const isSelected = selectedTableNumber === table.name.replace(/\D/g, '');

              let statusBorder = 'border-slate-800';
              let statusBg = 'bg-slate-950';
              let statusText = 'Tersedia';

              if (table.status === 'available') {
                statusBorder = 'border-emerald-500/30 hover:border-emerald-500/70';
                statusBg = 'bg-emerald-950/20';
                statusText = 'Tersedia';
              } else if (table.status === 'occupied') {
                statusBorder = 'border-amber-500/30 hover:border-amber-500/70';
                statusBg = 'bg-amber-950/20';
                statusText = 'Terisi';
              } else if (table.status === 'reserved') {
                statusBorder = 'border-cyan-500/30 hover:border-cyan-500/70';
                statusBg = 'bg-cyan-950/20';
                statusText = 'Reservasi';
              }

              return (
                <div
                  key={table.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectTable(table);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border ${statusBorder} ${statusBg} cursor-pointer transition-all flex flex-col justify-between gap-2.5 hover:scale-[1.02] ${
                    isSelected ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{table.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        table.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : table.status === 'occupied'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>Kapasitas: {table.capacity} Orang</span>
                    </div>

                    {table.status === 'occupied' && table.activeOrderTotal && (
                      <div className="text-[11px] font-mono font-bold text-amber-300">
                        Bill: {formatRupiah(table.activeOrderTotal)}
                      </div>
                    )}

                    {table.currentGuest && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {table.currentGuest}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                    {table.zone}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
