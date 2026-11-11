import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Plus, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  BarChart2, 
  Package, 
  Users, 
  Clock, 
  Receipt, 
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Product, CompletedOrder, UserRole } from '../types/pos';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface OwnerDashboardProps {
  products: Product[];
  completedOrders: CompletedOrder[];
  onOpenAddMenuModal: () => void;
  onOpenEditMenuModal: (product: Product) => void;
  onQuickToggleStock: (productId: string) => void;
  onQuickUpdatePrice: (productId: string, newPrice: number) => void;
  onSwitchRole: (role: UserRole) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  products,
  completedOrders,
  onOpenAddMenuModal,
  onOpenEditMenuModal,
  onQuickToggleStock,
  onQuickUpdatePrice,
  onSwitchRole,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu_manager' | 'audit_log'>('analytics');
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');

  // Time Range Selector State
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-11-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-11-09');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('2026-11-01');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('2026-11-09');

  const handleApplyCustomFilter = () => {
    soundManager.playSuccess();
    setAppliedStartDate(customStartDate);
    setAppliedEndDate(customEndDate);
  };

  // Live order calculations
  const liveOrderRevenue = useMemo(() => {
    return completedOrders.reduce((sum, ord) => sum + ord.grandTotal, 0);
  }, [completedOrders]);

  const liveOrdersCount = completedOrders.length;

  // Period Analytics Dataset
  const analyticsData = useMemo(() => {
    const baseTodayRev = 3840000 + liveOrderRevenue;
    const baseTodayOrders = 52 + liveOrdersCount;
    const baseTodayAvg = Math.round(baseTodayRev / baseTodayOrders);
    const todayTarget = 5000000;
    const todayTargetPct = Math.min(100, Math.round((baseTodayRev / todayTarget) * 100));

    switch (timeRange) {
      case 'yesterday':
        return {
          label: 'Kemarin (08 Nov 2026)',
          revenue: 3360000,
          revenueBadge: { text: '▼ -4.5% vs 2 hari lalu', isPositive: false },
          ordersCount: 48,
          ordersBadge: { text: '▼ -2.0% vs 2 hari lalu', isPositive: false },
          avgTicket: 70000,
          avgTicketBadge: { text: '▼ -2.5% vs 2 hari lalu', isPositive: false },
          marginPct: '67.8',
          grossProfit: 2278080,
          targetRevenue: 4500000,
          targetAchievedPct: 75,
          itemsSold: 104,
          categories: [
            { id: 'espresso', label: 'Espresso & Coffee', pct: 42, amount: 1411200, color: 'bg-emerald-500', textCol: 'text-emerald-400' },
            { id: 'meals', label: 'Heavy Meals / Food', pct: 31, amount: 1041600, color: 'bg-amber-500', textCol: 'text-amber-400' },
            { id: 'non_coffee', label: 'Non-Coffee & Tea', pct: 15, amount: 504000, color: 'bg-cyan-500', textCol: 'text-cyan-400' },
            { id: 'bakery', label: 'Artisan Pastry', pct: 12, amount: 403200, color: 'bg-purple-500', textCol: 'text-purple-400' },
          ],
          peakHours: [
            { hour: '08:00', h: '28%', val: 'Rp 180k' },
            { hour: '10:00', h: '52%', val: 'Rp 340k' },
            { hour: '12:00', h: '90%', val: 'Rp 590k', isPeak: true, peakLabel: 'Peak Siang' },
            { hour: '14:00', h: '64%', val: 'Rp 420k' },
            { hour: '16:00', h: '48%', val: 'Rp 310k' },
            { hour: '18:00', h: '68%', val: 'Rp 440k' },
            { hour: '20:00', h: '86%', val: 'Rp 560k', isPeak: true, peakLabel: 'Peak Malam' },
            { hour: '22:00', h: '34%', val: 'Rp 220k' },
          ],
          topItems: [
            { name: 'Ridex Signature Latte', qty: 38, revenue: 1216000, share: '36.2%' },
            { name: 'Nasi Goreng Ridex Special', qty: 24, revenue: 912000, share: '27.1%' },
            { name: 'Americano (Hot / Iced)', qty: 22, revenue: 528000, share: '15.7%' },
            { name: 'Artisan Matcha Latte', qty: 15, revenue: 450000, share: '13.4%' },
            { name: 'Butter Croissant', qty: 11, revenue: 242000, share: '7.2%' },
          ]
        };

      case 'this_week':
        return {
          label: 'Minggu Ini (03 - 09 Nov 2026)',
          revenue: 24850000,
          revenueBadge: { text: '▲ +18.6% dibanding minggu lalu', isPositive: true },
          ordersCount: 345,
          ordersBadge: { text: '▲ +12.4% vs minggu lalu', isPositive: true },
          avgTicket: 72028,
          avgTicketBadge: { text: '▲ +5.5% vs minggu lalu', isPositive: true },
          marginPct: '68.9',
          grossProfit: 17121650,
          targetRevenue: 30000000,
          targetAchievedPct: 83,
          itemsSold: 780,
          categories: [
            { id: 'espresso', label: 'Espresso & Coffee', pct: 46, amount: 11431000, color: 'bg-emerald-500', textCol: 'text-emerald-400' },
            { id: 'meals', label: 'Heavy Meals / Food', pct: 27, amount: 6709500, color: 'bg-amber-500', textCol: 'text-amber-400' },
            { id: 'non_coffee', label: 'Non-Coffee & Tea', pct: 17, amount: 4224500, color: 'bg-cyan-500', textCol: 'text-cyan-400' },
            { id: 'bakery', label: 'Artisan Pastry', pct: 10, amount: 2485000, color: 'bg-purple-500', textCol: 'text-purple-400' },
          ],
          peakHours: [
            { hour: '08:00', h: '40%', val: 'Rp 1.4M' },
            { hour: '10:00', h: '62%', val: 'Rp 2.2M' },
            { hour: '12:00', h: '98%', val: 'Rp 4.4M', isPeak: true, peakLabel: 'Peak Siang' },
            { hour: '14:00', h: '75%', val: 'Rp 3.2M' },
            { hour: '16:00', h: '55%', val: 'Rp 2.4M' },
            { hour: '18:00', h: '80%', val: 'Rp 3.5M' },
            { hour: '20:00', h: '95%', val: 'Rp 4.2M', isPeak: true, peakLabel: 'Peak Malam' },
            { hour: '22:00', h: '45%', val: 'Rp 1.9M' },
          ],
          topItems: [
            { name: 'Ridex Signature Latte', qty: 260, revenue: 8320000, share: '33.5%' },
            { name: 'Nasi Goreng Ridex Special', qty: 165, revenue: 6270000, share: '25.2%' },
            { name: 'Americano (Hot / Iced)', qty: 158, revenue: 3792000, share: '15.3%' },
            { name: 'Artisan Matcha Latte', qty: 110, revenue: 3300000, share: '13.3%' },
            { name: 'Butter Croissant', qty: 94, revenue: 2068000, share: '8.3%' },
          ]
        };

      case 'this_month':
        return {
          label: 'Bulan Ini (November 2026)',
          revenue: 98420000,
          revenueBadge: { text: '▲ +22.4% dibanding bulan lalu', isPositive: true },
          ordersCount: 1380,
          ordersBadge: { text: '▲ +15.1% vs bulan lalu', isPositive: true },
          avgTicket: 71318,
          avgTicketBadge: { text: '▲ +6.3% vs bulan lalu', isPositive: true },
          marginPct: '69.1',
          grossProfit: 68008220,
          targetRevenue: 120000000,
          targetAchievedPct: 82,
          itemsSold: 3120,
          categories: [
            { id: 'espresso', label: 'Espresso & Coffee', pct: 45, amount: 44289000, color: 'bg-emerald-500', textCol: 'text-emerald-400' },
            { id: 'meals', label: 'Heavy Meals / Food', pct: 29, amount: 28541800, color: 'bg-amber-500', textCol: 'text-amber-400' },
            { id: 'non_coffee', label: 'Non-Coffee & Tea', pct: 15, amount: 14763000, color: 'bg-cyan-500', textCol: 'text-cyan-400' },
            { id: 'bakery', label: 'Artisan Pastry', pct: 11, amount: 10826200, color: 'bg-purple-500', textCol: 'text-purple-400' },
          ],
          peakHours: [
            { hour: '08:00', h: '38%', val: 'Rp 6.2M' },
            { hour: '10:00', h: '60%', val: 'Rp 9.8M' },
            { hour: '12:00', h: '97%', val: 'Rp 18.4M', isPeak: true, peakLabel: 'Peak Siang' },
            { hour: '14:00', h: '74%', val: 'Rp 13.9M' },
            { hour: '16:00', h: '52%', val: 'Rp 10.2M' },
            { hour: '18:00', h: '78%', val: 'Rp 15.1M' },
            { hour: '20:00', h: '94%', val: 'Rp 17.8M', isPeak: true, peakLabel: 'Peak Malam' },
            { hour: '22:00', h: '42%', val: 'Rp 7.0M' },
          ],
          topItems: [
            { name: 'Ridex Signature Latte', qty: 1050, revenue: 33600000, share: '34.1%' },
            { name: 'Nasi Goreng Ridex Special', qty: 670, revenue: 25460000, share: '25.9%' },
            { name: 'Americano (Hot / Iced)', qty: 610, revenue: 14640000, share: '14.9%' },
            { name: 'Artisan Matcha Latte', qty: 440, revenue: 13200000, share: '13.4%' },
            { name: 'Butter Croissant', qty: 380, revenue: 8360000, share: '8.5%' },
          ]
        };

      case 'custom': {
        const days = 7;
        const custRev = 26500000;
        return {
          label: `Rentang Kustom (${appliedStartDate} s/d ${appliedEndDate})`,
          revenue: custRev,
          revenueBadge: { text: '▲ +16.8% dibanding periode serupa', isPositive: true },
          ordersCount: 368,
          ordersBadge: { text: '▲ +11.2% vs periode sebelumnya', isPositive: true },
          avgTicket: 72010,
          avgTicketBadge: { text: '▲ +5.0% vs periode sebelumnya', isPositive: true },
          marginPct: '68.6',
          grossProfit: Math.round(custRev * 0.686),
          targetRevenue: 32000000,
          targetAchievedPct: 83,
          itemsSold: 832,
          categories: [
            { id: 'espresso', label: 'Espresso & Coffee', pct: 45, amount: 11925000, color: 'bg-emerald-500', textCol: 'text-emerald-400' },
            { id: 'meals', label: 'Heavy Meals / Food', pct: 28, amount: 7420000, color: 'bg-amber-500', textCol: 'text-amber-400' },
            { id: 'non_coffee', label: 'Non-Coffee & Tea', pct: 16, amount: 4240000, color: 'bg-cyan-500', textCol: 'text-cyan-400' },
            { id: 'bakery', label: 'Artisan Pastry', pct: 11, amount: 2915000, color: 'bg-purple-500', textCol: 'text-purple-400' },
          ],
          peakHours: [
            { hour: '08:00', h: '38%', val: 'Rp 1.5M' },
            { hour: '10:00', h: '60%', val: 'Rp 2.4M' },
            { hour: '12:00', h: '96%', val: 'Rp 4.7M', isPeak: true, peakLabel: 'Peak Siang' },
            { hour: '14:00', h: '73%', val: 'Rp 3.4M' },
            { hour: '16:00', h: '53%', val: 'Rp 2.5M' },
            { hour: '18:00', h: '79%', val: 'Rp 3.8M' },
            { hour: '20:00', h: '93%', val: 'Rp 4.5M', isPeak: true, peakLabel: 'Peak Malam' },
            { hour: '22:00', h: '44%', val: 'Rp 2.1M' },
          ],
          topItems: [
            { name: 'Ridex Signature Latte', qty: 280, revenue: 8960000, share: '33.8%' },
            { name: 'Nasi Goreng Ridex Special', qty: 180, revenue: 6840000, share: '25.8%' },
            { name: 'Americano (Hot / Iced)', qty: 165, revenue: 3960000, share: '14.9%' },
            { name: 'Artisan Matcha Latte', qty: 120, revenue: 3600000, share: '13.6%' },
            { name: 'Butter Croissant', qty: 102, revenue: 2244000, share: '8.5%' },
          ]
        };
      }

      default: // today
        return {
          label: 'Hari Ini (Live Shift)',
          revenue: baseTodayRev,
          revenueBadge: { text: '▲ +14.2% dibanding periode sebelumnya', isPositive: true },
          ordersCount: baseTodayOrders,
          ordersBadge: { text: '▲ +8.0% vs kemarin', isPositive: true },
          avgTicket: baseTodayAvg,
          avgTicketBadge: { text: '▲ +5.7% vs kemarin', isPositive: true },
          marginPct: '68.4',
          grossProfit: Math.round(baseTodayRev * 0.684),
          targetRevenue: todayTarget,
          targetAchievedPct: todayTargetPct,
          itemsSold: 118 + (liveOrdersCount * 2),
          categories: [
            { id: 'espresso', label: 'Espresso & Coffee', pct: 44, amount: Math.round(baseTodayRev * 0.44), color: 'bg-emerald-500', textCol: 'text-emerald-400' },
            { id: 'meals', label: 'Heavy Meals / Food', pct: 28, amount: Math.round(baseTodayRev * 0.28), color: 'bg-amber-500', textCol: 'text-amber-400' },
            { id: 'non_coffee', label: 'Non-Coffee & Tea', pct: 16, amount: Math.round(baseTodayRev * 0.16), color: 'bg-cyan-500', textCol: 'text-cyan-400' },
            { id: 'bakery', label: 'Artisan Pastry', pct: 12, amount: Math.round(baseTodayRev * 0.12), color: 'bg-purple-500', textCol: 'text-purple-400' },
          ],
          peakHours: [
            { hour: '08:00', h: '35%', val: 'Rp 210k' },
            { hour: '10:00', h: '58%', val: 'Rp 380k' },
            { hour: '12:00', h: '96%', val: 'Rp 640k', isPeak: true, peakLabel: 'Peak Siang' },
            { hour: '14:00', h: '72%', val: 'Rp 490k' },
            { hour: '16:00', h: '50%', val: 'Rp 340k' },
            { hour: '18:00', h: '74%', val: 'Rp 480k' },
            { hour: '20:00', h: '92%', val: 'Rp 610k', isPeak: true, peakLabel: 'Peak Malam' },
            { hour: '22:00', h: '42%', val: 'Rp 280k' },
          ],
          topItems: [
            { name: 'Ridex Signature Latte', qty: 42 + liveOrdersCount, revenue: 1344000 + (liveOrdersCount * 32000), share: '35.0%' },
            { name: 'Nasi Goreng Ridex Special', qty: 28, revenue: 1064000, share: '27.7%' },
            { name: 'Americano (Hot / Iced)', qty: 26, revenue: 624000, share: '16.3%' },
            { name: 'Artisan Matcha Latte', qty: 18, revenue: 540000, share: '14.1%' },
            { name: 'Butter Croissant', qty: 12, revenue: 264000, share: '6.9%' },
          ]
        };
    }
  }, [timeRange, liveOrderRevenue, liveOrdersCount, appliedStartDate, appliedEndDate]);

  // Filtered menu for management
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(menuSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [products, menuSearch]);

  const handleStartEditPrice = (product: Product) => {
    soundManager.playClick();
    setEditingPriceId(product.id);
    setTempPriceInput(product.basePrice.toString());
  };

  const handleSavePrice = (productId: string) => {
    const val = parseInt(tempPriceInput.replace(/\D/g, '') || '0', 10);
    if (val > 0) {
      soundManager.playClick();
      onQuickUpdatePrice(productId, val);
    }
    setEditingPriceId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-950 text-amber-50 overflow-hidden select-none">
      {/* Top Navigation Bar in Dashboard */}
      <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('analytics');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analitik & Penjualan</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('menu_manager');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'menu_manager'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manajemen Menu & Stok ({products.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('audit_log');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'audit_log'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Log Transaksi Pegawai ({completedOrders.length})</span>
          </button>
        </div>

        {/* Quick Jump to Cashier or Kitchen */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 hidden sm:inline">Pindah Layar:</span>
          <button
            onClick={() => onSwitchRole('cashier')}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 text-xs font-semibold transition-all"
          >
            Buka Kasir POS
          </button>
          <button
            onClick={() => onSwitchRole('kitchen')}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 text-xs font-semibold transition-all"
          >
            Buka Dapur KDS
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'analytics' && (
          <>
            {/* 1. TIME RANGE FILTER CONTROL BAR */}
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-50 uppercase tracking-wider">Filter Periode Waktu Penjualan</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Data aktif: <strong className="text-amber-300 font-mono">{analyticsData.label}</strong>
                  </p>
                </div>
              </div>

              {/* Time Range Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-950 p-1.5 rounded-xl border border-stone-800 w-full md:w-auto">
                {[
                  { id: 'today', label: 'Hari Ini (Live)' },
                  { id: 'yesterday', label: 'Kemarin' },
                  { id: 'this_week', label: 'Minggu Ini' },
                  { id: 'this_month', label: 'Bulan Ini' },
                  { id: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundManager.playClick();
                      setTimeRange(item.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      timeRange === item.id
                        ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs with Warm Amber Caramel Confirmation Button */}
              {timeRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-2 bg-stone-950 p-2 rounded-xl border border-stone-800 text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400 font-medium">Dari:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-amber-50 text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-stone-500">s/d</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400 font-medium">Sampai:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-amber-50 text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomFilter}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terapkan Filter</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. KPI SUMMARY CARDS WITH COMPARISON METRICS & GROWTH BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Omzet Penjualan */}
              <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400">Total Omset Penjualan</span>
                    <span className="p-1 rounded bg-amber-600/20 text-amber-400">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-400 mt-2 block tabular-nums">
                    {formatRupiah(analyticsData.revenue)}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold flex items-center gap-1 ${analyticsData.revenueBadge.isPositive ? 'text-amber-400' : 'text-rose-400'}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${analyticsData.revenueBadge.isPositive ? '' : 'rotate-180'}`} />
                    {analyticsData.revenueBadge.text}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Transaksi Selesai */}
              <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400">Total Transaksi / Struk</span>
                    <span className="p-1 rounded bg-stone-800 text-amber-400">
                      <Receipt className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-50 mt-2 block tabular-nums">
                    {analyticsData.ordersCount} Struk
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold flex items-center gap-1 ${analyticsData.ordersBadge.isPositive ? 'text-amber-400' : 'text-rose-400'}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${analyticsData.ordersBadge.isPositive ? '' : 'rotate-180'}`} />
                    {analyticsData.ordersBadge.text}
                  </span>
                  <span className="text-stone-400 font-mono">{analyticsData.itemsSold} Porsi</span>
                </div>
              </div>

              {/* Card 3: Rata-Rata Belanja (Ticket Size) */}
              <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400">Rata-Rata Belanja (Ticket Size)</span>
                    <span className="p-1 rounded bg-stone-800 text-amber-400">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-300 mt-2 block tabular-nums">
                    {formatRupiah(analyticsData.avgTicket)}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold flex items-center gap-1 ${analyticsData.avgTicketBadge.isPositive ? 'text-amber-400' : 'text-rose-400'}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${analyticsData.avgTicketBadge.isPositive ? '' : 'rotate-180'}`} />
                    {analyticsData.avgTicketBadge.text}
                  </span>
                  <span className="text-stone-400">Per Tamu</span>
                </div>
              </div>

              {/* Card 4: Estimasi Margin Laba Kotor */}
              <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400">Estimasi Margin Laba Kotor</span>
                    <span className="p-1 rounded bg-amber-950 text-amber-400">
                      <Percent className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-400 mt-2 block tabular-nums">
                    {analyticsData.marginPct}%
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[11px]">
                  <span className="text-stone-300 font-mono font-medium">Laba: {formatRupiah(analyticsData.grossProfit)}</span>
                  <span className="text-amber-400 font-medium">HPP Stabil</span>
                </div>
              </div>
            </div>

            {/* 3. PERCENTAGE DISTRIBUTION BARS & TARGET OMZET PROGRESS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Sales Distribution Stacked Bar */}
              <div className="lg:col-span-2 bg-stone-900 p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-amber-50">Distribusi Penjualan per Kategori Menu</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Persentase kontribusi omzet terhadap total penjualan kafe</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 font-mono text-amber-400 font-bold">
                    100% Terdistribusi
                  </span>
                </div>

                {/* Multi-color Stacked Progress Bar */}
                <div className="w-full h-4 rounded-full bg-stone-950 overflow-hidden flex shadow-inner border border-stone-800">
                  {analyticsData.categories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{ width: `${cat.pct}%` }}
                      className={`${cat.color} hover:brightness-110 transition-all cursor-pointer relative group`}
                      title={`${cat.label}: ${cat.pct}% (${formatRupiah(cat.amount)})`}
                    />
                  ))}
                </div>

                {/* Category Legends with Nominal & Percentage */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {analyticsData.categories.map((cat) => (
                    <div key={cat.id} className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                        <span className="text-[11px] font-semibold text-stone-300 truncate">{cat.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className={`font-mono font-bold text-sm ${cat.textCol}`}>{cat.pct}%</span>
                        <span className="text-[10px] text-stone-400 font-mono">{formatRupiah(cat.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Omzet Achievement Widget */}
              <div className="bg-stone-900 p-5 rounded-2xl border border-stone-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-50">Target Omzet Periode</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold">
                      {analyticsData.targetAchievedPct >= 100 ? 'TARGET TERCAPAI' : 'ON TRACK'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">Target: <strong className="text-amber-50 font-mono">{formatRupiah(analyticsData.targetRevenue)}</strong></p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-stone-400">Tercapai: <strong className="text-amber-400 font-bold">{formatRupiah(analyticsData.revenue)}</strong></span>
                    <span className="text-amber-300 font-bold">{analyticsData.targetAchievedPct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
                    <div
                      style={{ width: `${Math.min(100, analyticsData.targetAchievedPct)}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between">
                  <span>Sisa ke Target:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatRupiah(Math.max(0, analyticsData.targetRevenue - analyticsData.revenue))}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. HOURLY PEAK SALES CHART & TOP 5 BEST SELLERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Sales Visual Bars with Highlighted Peak Hours */}
              <div className="lg:col-span-2 bg-stone-900 p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-amber-50">Distribusi Penjualan Jam Operasional Kafe</h3>
                    <p className="text-xs text-stone-400">
                      Visualisasi jam sibuk: <span className="text-amber-400 font-semibold">12:00–14:00 (Lunch)</span> &amp; <span className="text-amber-300 font-semibold">19:00–21:00 (Dinner)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-stone-300 font-mono">
                      <span className="w-2 h-2 rounded-full bg-stone-600" /> Normal
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Peak Hour
                    </span>
                  </div>
                </div>

                {/* Responsive CSS Bar Chart */}
                <div className="pt-6 flex items-end justify-between gap-2 sm:gap-3 h-48 border-b border-stone-800 pb-2">
                  {analyticsData.peakHours.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      {bar.isPeak && (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-950/90 border border-amber-600/40 px-1 py-0.2 rounded absolute -top-5 whitespace-nowrap animate-pulse">
                          {bar.peakLabel}
                        </span>
                      )}

                      <div
                        style={{ height: bar.h }}
                        className={`w-full rounded-t-lg transition-all cursor-pointer relative shadow-sm ${
                          bar.isPeak
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300'
                            : 'bg-gradient-to-t from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600'
                        }`}
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-950 border border-stone-700 text-[10px] font-mono text-amber-50 px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                          {bar.val}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono ${bar.isPeak ? 'text-amber-300 font-bold' : 'text-stone-400'}`}>
                        {bar.hour}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Best Sellers Card with Share % */}
              <div className="bg-stone-900 p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-50">Top 5 Menu Terlaris</h3>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    Paling Diminati
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analyticsData.topItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-stone-900 border border-stone-800 font-mono font-bold text-[10px] flex items-center justify-center text-amber-400 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-amber-50 block truncate">{item.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{item.qty} Porsi Terjual</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-400 block">
                          {formatRupiah(item.revenue)}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">{item.share}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'menu_manager' && (
          <div className="space-y-4">
            {/* Top Toolbar for Menu Management */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 p-3.5 rounded-2xl border border-stone-800">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Cari menu untuk ubah harga / stok..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenAddMenuModal();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            {/* Menu List Table */}
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Menu &amp; SKU</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Harga Jual (Kasir)</th>
                      <th className="py-3 px-3">HPP Modal</th>
                      <th className="py-3 px-3">Margin Estimasi</th>
                      <th className="py-3 px-3">Stok</th>
                      <th className="py-3 px-3">Status Ketersediaan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80">
                    {filteredProducts.map((p) => {
                      const cost = p.costPrice || Math.round(p.basePrice * 0.35);
                      const profit = p.basePrice - cost;
                      const marginPct = p.basePrice > 0 ? ((profit / p.basePrice) * 100).toFixed(0) : '0';

                      return (
                        <tr key={p.id} className="hover:bg-stone-850 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-50 block">{p.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{p.sku}</span>
                          </td>

                          <td className="py-3 px-3 capitalize text-stone-300">
                            {p.category.replace('_', ' ')}
                          </td>

                          {/* Inline Price Editor */}
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">
                            {editingPriceId === p.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                   type="text"
                                  value={tempPriceInput}
                                  onChange={(e) => setTempPriceInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePrice(p.id);
                                    if (e.key === 'Escape') setEditingPriceId(null);
                                  }}
                                  className="w-24 bg-stone-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-50"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSavePrice(p.id)}
                                  className="px-1.5 py-0.5 bg-amber-600 text-stone-950 font-bold rounded text-[10px]"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <span
                                onClick={() => handleStartEditPrice(p)}
                                className="cursor-pointer hover:underline title='Klik untuk ubah harga'"
                              >
                                {formatRupiah(p.basePrice)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono text-stone-400">
                            {formatRupiah(cost)}
                          </td>

                          <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                            {marginPct}% ({formatRupiah(profit)})
                          </td>

                          <td className="py-3 px-3 font-mono text-stone-200">
                            {p.stock}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onQuickToggleStock(p.id);
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                                p.badge === 'Tersedia'
                                  ? 'bg-amber-950/80 border-amber-600/40 text-amber-300'
                                  : p.badge === 'Stok Menipis'
                                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {p.badge}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onOpenEditMenuModal(p);
                              }}
                              className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors"
                              title="Edit Detail Lengkap Menu"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit_log' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-50">Log Transaksi Kasir &amp; Audit Pegawai</h3>
                <p className="text-xs text-stone-400">Riwayat seluruh transaksi yang dicatat sistem Loka POS hari ini</p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">
                Total: {completedOrders.length} Transaksi
              </span>
            </div>

            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">No. Struk</th>
                      <th className="py-3 px-3">Waktu</th>
                      <th className="py-3 px-3">Kasir</th>
                      <th className="py-3 px-3">Tipe &amp; Meja</th>
                      <th className="py-3 px-3">Pelanggan</th>
                      <th className="py-3 px-3">Metode Bayar</th>
                      <th className="py-3 px-4 text-right">Total Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80">
                    {completedOrders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-stone-850 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-50">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-stone-400">
                          {ord.timestamp}
                        </td>
                        <td className="py-3 px-3 text-stone-200">
                          {ord.cashierName}
                        </td>
                        <td className="py-3 px-3 uppercase text-stone-400">
                          {ord.orderType === 'dine_in' ? `Meja ${ord.tableNumber || '-'}` : ord.orderType}
                        </td>
                        <td className="py-3 px-3 text-stone-300">
                          {ord.customerName || 'Pelanggan'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-950 border border-stone-800 text-amber-300">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 text-right">
                          {formatRupiah(ord.grandTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
