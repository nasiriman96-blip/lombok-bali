import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Store, ShoppingCart, Receipt, HandCoins, History as HistoryIcon,
  FileBarChart, Package, Settings as SettingsIcon, Plus, Sun, Moon, Menu, X, Search,
  Download, Printer, Send, TrendingUp, TrendingDown, Wallet, PiggyBank, CheckCircle2,
  AlertCircle, Circle, Edit2, Trash2, Building2, Phone,
  MapPin, CreditCard, Banknote, Smartphone, QrCode, ArrowUpRight, ArrowDownRight,
  Boxes, ClipboardList, LogOut, ShieldCheck, UserCircle2, Sparkles,
  AlertTriangle, ImagePlus, Lock
} from "lucide-react";
import { loadAppData, saveAppData, subscribeAppData, signIn, signOutUser, getActiveUser, subscribeAuth } from "./lib/storage";

/* ======================================================================
   TOKO FINANCE — multi-store finance management
   Single-file React app. Persists via window.storage (personal, per-user).
   ====================================================================== */

const STORAGE_KEY = "tokofinance:db:v1";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
:root { --font-display: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif; }
.font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
.font-body { font-family: var(--font-body); }
.tabular { font-variant-numeric: tabular-nums; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.animate-fadeUp { animation: fadeUp .35s ease-out both; }
@keyframes scaleIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
.animate-scaleIn { animation: scaleIn .2s ease-out both; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(148,163,184,.4); border-radius: 8px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
`;

/* ---------------------------- helpers ---------------------------- */
const uid = (p = "id") => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Math.round(n || 0)
  );

const fmtIDRshort = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, "") + " M";
  if (abs >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + " Jt";
  if (abs >= 1e3) return (v / 1e3).toFixed(0) + " Rb";
  return String(v);
};

const fmtDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", ...opts });

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function periodRange(period, custom) {
  const now = new Date();
  switch (period) {
    case "today": return [startOfDay(now), endOfDay(now)];
    case "yesterday": { const y = addDays(now, -1); return [startOfDay(y), endOfDay(y)]; }
    case "week": { const start = addDays(now, -(now.getDay() === 0 ? 6 : now.getDay() - 1)); return [startOfDay(start), endOfDay(now)]; }
    case "month": { const start = new Date(now.getFullYear(), now.getMonth(), 1); return [startOfDay(start), endOfDay(now)]; }
    case "year": { const start = new Date(now.getFullYear(), 0, 1); return [startOfDay(start), endOfDay(now)]; }
    case "custom": return [startOfDay(custom?.from || now), endOfDay(custom?.to || now)];
    default: return [startOfDay(now), endOfDay(now)];
  }
}

function inRange(dateStr, range) {
  const t = new Date(dateStr).getTime();
  return t >= range[0].getTime() && t <= range[1].getTime();
}

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote, color: "#16A34A" },
  { id: "transfer", label: "Transfer", icon: Landmark2, color: "#2563EB" },
  { id: "qris", label: "QRIS", icon: QrCode, color: "#7C3AED" },
  { id: "ewallet", label: "E-Wallet", icon: Smartphone, color: "#EA580C" },
  { id: "debit", label: "Debit", icon: CreditCard, color: "#0891B2" },
  { id: "kredit", label: "Kredit", icon: CreditCard, color: "#DB2777" },
];
function Landmark2(props) { return <Building2 {...props} />; }

const EXPENSE_CATEGORIES = [
  "Belanja barang", "Bahan baku", "Gaji", "Listrik", "Air", "Internet",
  "Transportasi", "Sewa", "Perawatan", "Operasional", "Marketing", "Lainnya",
];

const HANDOVER_TYPES = ["Serahan keuntungan", "Setoran kas", "Setoran pemilik", "Lainnya"];

const ROLES = [
  { id: "super_admin", label: "Super Admin", icon: ShieldCheck, desc: "Akses penuh semua toko & sistem" },
  { id: "owner", label: "Owner", icon: UserCircle2, desc: "Lihat semua toko, keuntungan & serahan" },
  { id: "manager", label: "Manager", icon: UserCircle2, desc: "Kelola toko tertentu" },
  { id: "kasir", label: "Kasir", icon: UserCircle2, desc: "Input penjualan toko sendiri" },
];

const BRAND = { indigo: "#4F46E5", indigoSoft: "#EEF2FF" };
const CHART_COLORS = ["#4F46E5", "#F59E0B", "#0EA5E9", "#DB2777", "#16A34A", "#7C3AED"];

/* ---------------------------- demo data ---------------------------- */
function genDemoData() {
  const stores = [
    { id: "st_a", name: "Toko A - Kopi Senja", address: "Jl. Merdeka No. 12, Bandung", whatsapp: "6281234560001", owner: "Budi Santoso", pic: "Rani", initialBalance: 5000000, initialCapital: 20000000, status: "active", logoColor: "#4F46E5" },
    { id: "st_b", name: "Toko B - Warung Nyonya", address: "Jl. Sudirman No. 45, Jakarta", whatsapp: "6281234560002", owner: "Budi Santoso", pic: "Dedi", initialBalance: 3500000, initialCapital: 15000000, status: "active", logoColor: "#16A34A" },
    { id: "st_c", name: "Toko C - Roti Bahagia", address: "Jl. Diponegoro No. 8, Surabaya", whatsapp: "6281234560003", owner: "Budi Santoso", pic: "Sinta", initialBalance: 4200000, initialCapital: 18000000, status: "active", logoColor: "#F59E0B" },
    { id: "st_d", name: "Toko D - Laundry Bersih", address: "Jl. Gatot Subroto No. 3, Semarang", whatsapp: "6281234560004", owner: "Budi Santoso", pic: "Andi", initialBalance: 1800000, initialCapital: 10000000, status: "nonactive", logoColor: "#DB2777" },
  ];

  const productsByStore = {
    st_a: [
      { name: "Kopi Susu", price: 22000, cost: 9000, sku: "KS-01" },
      { name: "Americano", price: 18000, cost: 6000, sku: "AM-01" },
      { name: "Croissant", price: 25000, cost: 12000, sku: "CR-01" },
      { name: "Matcha Latte", price: 24000, cost: 10000, sku: "ML-01" },
    ],
    st_b: [
      { name: "Nasi Campur", price: 20000, cost: 11000, sku: "NC-01" },
      { name: "Es Teh", price: 5000, cost: 1500, sku: "ET-01" },
      { name: "Ayam Goreng", price: 15000, cost: 8000, sku: "AG-01" },
      { name: "Tahu Tempe", price: 8000, cost: 3500, sku: "TT-01" },
    ],
    st_c: [
      { name: "Roti Coklat", price: 12000, cost: 5000, sku: "RC-01" },
      { name: "Roti Keju", price: 13000, cost: 5500, sku: "RK-01" },
      { name: "Donat", price: 8000, cost: 3000, sku: "DN-01" },
      { name: "Brownies", price: 18000, cost: 7500, sku: "BR-01" },
    ],
    st_d: [
      { name: "Cuci Kiloan", price: 7000, cost: 2500, sku: "CK-01" },
      { name: "Cuci Sepatu", price: 25000, cost: 8000, sku: "CS-01" },
      { name: "Setrika", price: 4000, cost: 1000, sku: "SR-01" },
    ],
  };

  const products = [];
  for (const s of stores) {
    (productsByStore[s.id] || []).forEach((p, i) => {
      products.push({
        id: uid("prod"), storeId: s.id, name: p.name, sku: p.sku, category: "Umum",
        price: p.price, cost: p.cost, stock: 40 + Math.floor(Math.random() * 60),
        minStock: 10, status: "active",
      });
    });
  }

  const sales = [];
  const expenses = [];
  const handovers = [];
  const cashiers = ["Rani", "Dedi", "Sinta", "Andi", "Wulan"];
  const today = new Date();

  for (const s of stores) {
    if (s.status !== "active") continue;
    const storeProducts = products.filter((p) => p.storeId === s.id);
    for (let dOffset = 29; dOffset >= 0; dOffset--) {
      const day = addDays(today, -dOffset);
      const numSales = 4 + Math.floor(Math.random() * 8);
      let dayTotal = 0;
      const methodTotals = { cash: 0, transfer: 0, qris: 0, ewallet: 0, debit: 0, kredit: 0 };
      for (let i = 0; i < numSales; i++) {
        const hour = 8 + Math.floor(Math.random() * 12);
        const minute = Math.floor(Math.random() * 60);
        const date = new Date(day); date.setHours(hour, minute, 0, 0);
        const itemCount = 1 + Math.floor(Math.random() * 3);
        const items = [];
        let subtotal = 0;
        for (let k = 0; k < itemCount; k++) {
          const p = storeProducts[Math.floor(Math.random() * storeProducts.length)];
          const qty = 1 + Math.floor(Math.random() * 3);
          const lineTotal = p.price * qty;
          subtotal += lineTotal;
          items.push({ productId: p.id, name: p.name, qty, price: p.price, cost: p.cost, total: lineTotal });
        }
        const discount = Math.random() < 0.2 ? Math.round(subtotal * 0.05) : 0;
        const total = subtotal - discount;
        const method = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)].id;
        methodTotals[method] += total;
        dayTotal += total;
        sales.push({
          id: uid("sale"), storeId: s.id, date: date.toISOString(), txNumber: `TRX-${s.id.slice(3).toUpperCase()}-${dayKey(date).replace(/-/g, "")}-${String(i + 1).padStart(3, "0")}`,
          items, subtotal, discount, total, method, cashier: cashiers[Math.floor(Math.random() * cashiers.length)], notes: "",
        });
      }
      // expenses ~1-2 per day
      const numExp = Math.random() < 0.7 ? 1 : 2;
      let expTotal = 0;
      for (let i = 0; i < numExp; i++) {
        const cat = EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
        const amount = Math.round((30000 + Math.random() * 250000) / 1000) * 1000;
        expTotal += amount;
        const date = new Date(day); date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
        expenses.push({
          id: uid("exp"), storeId: s.id, date: date.toISOString(), category: cat, amount,
          method: Math.random() < 0.6 ? "cash" : "transfer", description: `${cat} harian`,
          by: cashiers[Math.floor(Math.random() * cashiers.length)], notes: "", proof: null,
        });
      }
      // handover: most days handed over most of profit
      const profit = dayTotal - expTotal;
      if (profit > 0 && Math.random() < 0.85) {
        const pct = 0.5 + Math.random() * 0.5;
        const amount = Math.round((profit * pct) / 1000) * 1000;
        const date = new Date(day); date.setHours(20, Math.floor(Math.random() * 60));
        handovers.push({
          id: uid("hd"), storeId: s.id, date: date.toISOString(), amount,
          type: "Serahan keuntungan", by: s.pic, receivedBy: s.owner,
          method: Math.random() < 0.5 ? "cash" : "transfer", notes: "", proof: null,
        });
      }
    }
  }

  return { stores, products, sales, expenses, handovers, notifications: [], auditLog: [] };
}

/* ---------------------------- storage (Supabase, bukan window.storage) ---------------------------- */
async function loadDB() {
  return await loadAppData();
}
async function saveDB(db) {
  await saveAppData(db);
}

/* ---------------------------- context ---------------------------- */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ---------------------------- UI atoms ---------------------------- */
function cx(...a) { return a.filter(Boolean).join(" "); }

function Card({ className, children, ...rest }) {
  const { dark } = useApp();
  return (
    <div
      className={cx(
        "rounded-2xl border shadow-sm",
        dark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function Badge({ tone = "neutral", children, className }) {
  const { dark } = useApp();
  const tones = {
    green: dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700",
    red: dark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-700",
    amber: dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700",
    indigo: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-700",
    neutral: dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600",
  };
  return <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", tones[tone], className)}>{children}</span>;
}

function Btn({ variant = "primary", size = "md", className, children, ...rest }) {
  const { dark } = useApp();
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-sm" };
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20",
    green: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20",
    red: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20",
    ghost: dark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    subtle: dark ? "bg-slate-700/50 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700",
  };
  return (
    <button className={cx("inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none", sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

function Field({ label, children, hint, required }) {
  const { dark } = useApp();
  return (
    <label className="block">
      <span className={cx("block text-xs font-semibold mb-1.5", dark ? "text-slate-300" : "text-slate-600")}>
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className={cx("block text-[11px] mt-1", dark ? "text-slate-500" : "text-slate-400")}>{hint}</span>}
    </label>
  );
}

function inputCls(dark) {
  return cx(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2",
    dark ? "bg-slate-900 border-slate-700 text-slate-100 focus:ring-indigo-500/40 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:ring-indigo-500/30 focus:border-indigo-400"
  );
}
function Input(props) { const { dark } = useApp(); return <input {...props} className={cx(inputCls(dark), props.className)} />; }
function Select(props) { const { dark } = useApp(); return <select {...props} className={cx(inputCls(dark), "appearance-none", props.className)} />; }
function Textarea(props) { const { dark } = useApp(); return <textarea {...props} className={cx(inputCls(dark), props.className)} />; }

function Modal({ open, onClose, title, children, wide }) {
  const { dark } = useApp();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cx("relative w-full animate-scaleIn rounded-t-3xl sm:rounded-2xl border max-h-[92vh] overflow-y-auto",
        wide ? "sm:max-w-2xl" : "sm:max-w-md", dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
        <div className={cx("sticky top-0 flex items-center justify-between px-5 py-4 border-b backdrop-blur", dark ? "bg-slate-800/95 border-slate-700" : "bg-white/95 border-slate-100")}>
          <h3 className="font-display font-bold text-base">{title}</h3>
          <button onClick={onClose} className={cx("p-1.5 rounded-lg", dark ? "hover:bg-slate-700" : "hover:bg-slate-100")}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "indigo", delay = 0 }) {
  const { dark } = useApp();
  const tones = {
    indigo: { bg: dark ? "bg-indigo-500/15" : "bg-indigo-50", fg: "text-indigo-500" },
    green: { bg: dark ? "bg-emerald-500/15" : "bg-emerald-50", fg: "text-emerald-500" },
    red: { bg: dark ? "bg-rose-500/15" : "bg-rose-50", fg: "text-rose-500" },
    amber: { bg: dark ? "bg-amber-500/15" : "bg-amber-50", fg: "text-amber-500" },
  };
  const t = tones[tone];
  return (
    <Card className="p-4 sm:p-5 animate-fadeUp" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cx("text-xs font-medium", dark ? "text-slate-400" : "text-slate-500")}>{label}</p>
          <p className="font-display text-xl sm:text-2xl font-extrabold mt-1 tabular">{value}</p>
          {sub && <p className={cx("text-xs mt-1.5 flex items-center gap-1", dark ? "text-slate-400" : "text-slate-500")}>{sub}</p>}
        </div>
        <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.bg, t.fg)}>
          <Icon size={19} />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon = ClipboardList, title, desc }) {
  const { dark } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className={cx("w-14 h-14 rounded-2xl flex items-center justify-center mb-3", dark ? "bg-slate-800" : "bg-slate-100")}>
        <Icon size={24} className={dark ? "text-slate-500" : "text-slate-400"} />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      {desc && <p className={cx("text-xs mt-1 max-w-xs", dark ? "text-slate-500" : "text-slate-400")}>{desc}</p>}
    </div>
  );
}

/* ---------------------------- period filter ---------------------------- */
const PERIODS = [
  { id: "today", label: "Hari ini" },
  { id: "yesterday", label: "Kemarin" },
  { id: "week", label: "Minggu ini" },
  { id: "month", label: "Bulan ini" },
  { id: "year", label: "Tahun ini" },
  { id: "custom", label: "Custom" },
];

function PeriodFilter({ period, setPeriod, custom, setCustom }) {
  const { dark } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className={cx("flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar", dark ? "bg-slate-800" : "bg-slate-100")}>
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cx("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
              period === p.id ? "bg-indigo-600 text-white shadow" : dark ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-white")}>
            {p.label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="!py-1.5 !text-xs w-[130px]" />
          <span className={dark ? "text-slate-500" : "text-slate-400"}>—</span>
          <Input type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="!py-1.5 !text-xs w-[130px]" />
        </div>
      )}
    </div>
  );
}

/* ---------------------------- WhatsApp report ---------------------------- */
function buildWaMessage({ storeName, date, sales, expenses, handoverAmount }) {
  const totals = { cash: 0, transfer: 0, qris: 0, ewallet: 0, debit: 0, kredit: 0 };
  let totalSales = 0;
  sales.forEach((s) => { totals[s.method] = (totals[s.method] || 0) + s.total; totalSales += s.total; });
  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0);
  const profit = totalSales - totalExpense;
  const remaining = profit - handoverAmount;
  const methodLines = PAYMENT_METHODS.filter((m) => totals[m.id] > 0)
    .map((m) => `${m.label}: ${fmtIDR(totals[m.id])}`).join("\n");

  return `LAPORAN PENJUALAN
━━━━━━━━━━━━━━
🏪 Toko: ${storeName}
📅 Tanggal: ${fmtDate(date)}
⏰ Jam: ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}

💰 PENJUALAN
Total: ${fmtIDR(totalSales)}

${methodLines || "-"}

💸 PENGELUARAN
${fmtIDR(totalExpense)}

📈 KEUNTUNGAN
${fmtIDR(profit)}

💰 UANG DISERAHKAN
${fmtIDR(handoverAmount)}

💵 SISA
${fmtIDR(remaining)}

━━━━━━━━━━━━━━
Laporan otomatis dari TOKO FINANCE.`;
}

function WhatsAppSendRow({ message, store }) {
  const targets = [
    { label: "Owner", phone: store?.whatsapp },
    { label: "Manager", phone: store?.whatsapp },
    { label: "Admin", phone: store?.whatsapp },
  ];
  const send = (phone) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text: message }); return; } catch (e) {} }
    send(store?.whatsapp);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((t) => (
        <Btn key={t.label} variant="green" size="sm" onClick={() => send(t.phone)}>
          <Send size={13} /> Kirim ke {t.label}
        </Btn>
      ))}
      <Btn variant="ghost" size="sm" onClick={share}><ArrowUpRight size={13} /> Share laporan</Btn>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null); // {role, name}
  const [userChecked, setUserChecked] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [activeStoreId, setActiveStoreId] = useState("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const skipNextSave = useRef(false);

  // Cek sesi login Supabase yang masih aktif + dengarkan perubahan sesi
  useEffect(() => {
    getActiveUser().then((u) => {
      if (u) setUser({ role: u.role === "admin" ? "owner" : "kasir", name: u.name });
      setUserChecked(true);
    });
    const unsub = subscribeAuth((u) => {
      setUser(u ? { role: u.role === "admin" ? "owner" : "kasir", name: u.name } : null);
    });
    return unsub;
  }, []);

  const handleLogout = async () => { await signOutUser(); setUser(null); };

  // Ambil data HANYA setelah login dipastikan (supaya tidak "keduluan" ditolak
  // oleh aturan akses Supabase yang mewajibkan sesi login sah).
  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await loadDB();
      skipNextSave.current = true;
      setDb(existing || genDemoData());
      setLoading(false);
    })();
  }, [user]);

  // Sinkron real-time: kalau ada perubahan dari perangkat/anggota tim lain, langsung terapkan di sini.
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeAppData((data) => {
      if (!data) return;
      skipNextSave.current = true;
      setDb(data);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!loading && db) {
      if (skipNextSave.current) { skipNextSave.current = false; return; }
      saveDB(db);
    }
  }, [db, loading]);

  const notify = useCallback((msg, tone = "green") => {
    setToast({ msg, tone, id: uid("t") });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 2600);
  }, []);

  const activeStores = useMemo(() => (db ? db.stores.filter((s) => s.status === "active") : []), [db]);
  const currentStore = useMemo(() => db?.stores.find((s) => s.id === activeStoreId) || null, [db, activeStoreId]);

  if (!userChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <style>{FONT_STYLE}</style>
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-sm">Memuat TOKO FINANCE…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cx("min-h-screen font-body", dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800")}>
        <style>{FONT_STYLE}</style>
        <LoginScreen dark={dark} setDark={setDark} onLogin={setUser} />
      </div>
    );
  }

  if (loading || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <style>{FONT_STYLE}</style>
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-sm">Memuat data…</p>
        </div>
      </div>
    );
  }

  const ctx = { dark, db, setDb, notify, user, activeStoreId, setActiveStoreId, currentStore, activeStores };

  return (
    <AppCtx.Provider value={ctx}>
      <div className={cx("min-h-screen font-body", dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800")}>
        <style>{FONT_STYLE}</style>
        <div className="flex">
          <Sidebar page={page} setPage={setPage} open={mobileNavOpen} setOpen={setMobileNavOpen} />
          <div className="flex-1 min-w-0 flex flex-col lg:pl-64">
            <TopBar page={page} setPage={setPage} dark={dark} setDark={setDark} onMenu={() => setMobileNavOpen(true)} onLogout={handleLogout} />
            <main className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
              <PageRouter page={page} setPage={setPage} notify={notify} />
            </main>
          </div>
        </div>
        <BottomNav page={page} setPage={setPage} />
        {toast && <Toast toast={toast} />}
      </div>
    </AppCtx.Provider>
  );
}

function Toast({ toast }) {
  const { dark } = useApp();
  const tones = { green: "bg-emerald-600", red: "bg-rose-600", indigo: "bg-indigo-600" };
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fadeUp">
      <div className={cx("px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2", tones[toast.tone] || tones.indigo)}>
        <CheckCircle2 size={16} /> {toast.msg}
      </div>
    </div>
  );
}

/* ---------------------------- Login ---------------------------- */
function LoginScreen({ dark, setDark, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    setError("");
    const res = await signIn(username, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    // role dari Supabase Auth: "admin" -> Owner (akses penuh), "staff" -> Kasir (input saja)
    onLogin({ role: res.user.role === "admin" ? "owner" : "kasir", name: res.user.name });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <button onClick={() => setDark((d) => !d)} className={cx("absolute top-4 right-4 p-2.5 rounded-xl", dark ? "bg-slate-800 text-amber-300" : "bg-white text-slate-600 border border-slate-200")}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="w-full max-w-sm animate-fadeUp">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <p className="font-display font-extrabold text-lg leading-none">TOKO FINANCE</p>
            <p className={cx("text-[11px] mt-0.5", dark ? "text-slate-400" : "text-slate-500")}>Manajemen keuangan multi-toko</p>
          </div>
        </div>
        <div className={cx("rounded-2xl border p-5 shadow-sm", dark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200")}>
          <p className={cx("text-xs font-semibold mb-2", dark ? "text-slate-300" : "text-slate-600")}>Username</p>
          <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="admin"
            className={cx("w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4", dark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200")} />
          <p className={cx("text-xs font-semibold mb-2", dark ? "text-slate-300" : "text-slate-600")}>Password</p>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="••••••••"
            className={cx("w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-5", dark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200")} />
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20">{error}</div>
          )}
          <button onClick={submit} disabled={!username.trim() || !password || loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-[.98] flex items-center justify-center gap-2">
            <Lock size={15} /> {loading ? "Memeriksa…" : "Masuk"}
          </button>
        </div>
        <p className={cx("text-center text-[11px] mt-5", dark ? "text-slate-500" : "text-slate-400")}>
          Data tersinkron real-time ke semua perangkat tim Anda.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- Navigation ---------------------------- */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Input Penjualan", icon: ShoppingCart },
  { id: "expense", label: "Input Pengeluaran", icon: Receipt },
  { id: "handover", label: "Serahan / Setoran", icon: HandCoins },
  { id: "history", label: "Riwayat Transaksi", icon: HistoryIcon },
  { id: "reports", label: "Laporan", icon: FileBarChart },
  { id: "products", label: "Produk & Stok", icon: Package },
  { id: "stores", label: "Kelola Toko", icon: Store },
  { id: "settings", label: "Pengaturan", icon: SettingsIcon },
];
const BOTTOM_NAV = ["dashboard", "history", "sales", "reports", "stores"];

function Sidebar({ page, setPage, open, setOpen }) {
  const { dark, db, activeStoreId } = useApp();
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx(
        "fixed z-50 lg:z-30 top-0 left-0 h-full w-64 border-r flex flex-col transition-transform duration-300 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-600/25">
              <Wallet size={18} className="text-white" />
            </div>
            <p className="font-display font-extrabold text-[15px] leading-none">TOKO FINANCE</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false); }}
              className={cx("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition",
                page === n.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")}>
              <n.icon size={17} /> {n.label}
            </button>
          ))}
        </nav>
        <div className={cx("m-3 p-3.5 rounded-xl", dark ? "bg-slate-800" : "bg-indigo-50")}>
          <p className={cx("text-[11px] font-semibold mb-1", dark ? "text-slate-300" : "text-indigo-700")}>Toko aktif</p>
          <p className="text-xs font-medium truncate">{activeStoreId === "all" ? "Semua Toko" : db.stores.find((s) => s.id === activeStoreId)?.name}</p>
        </div>
      </aside>
    </>
  );
}

function BottomNav({ page, setPage }) {
  const { dark } = useApp();
  const items = NAV.filter((n) => BOTTOM_NAV.includes(n.id));
  return (
    <nav className={cx("fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t backdrop-blur-lg", dark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200")}>
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {items.map((n) => {
          const active = page === n.id;
          if (n.id === "sales") {
            return (
              <button key={n.id} onClick={() => setPage(n.id)} className="flex flex-col items-center -mt-5">
                <span className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  <Plus size={22} />
                </span>
                <span className={cx("text-[10px] font-semibold mt-1", active ? "text-indigo-500" : dark ? "text-slate-400" : "text-slate-500")}>Jual</span>
              </button>
            );
          }
          return (
            <button key={n.id} onClick={() => setPage(n.id)} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[56px]">
              <n.icon size={19} className={active ? "text-indigo-500" : dark ? "text-slate-400" : "text-slate-400"} />
              <span className={cx("text-[10px] font-medium", active ? "text-indigo-500" : dark ? "text-slate-500" : "text-slate-500")}>{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({ page, dark, setDark, onMenu, onLogout }) {
  const { db, activeStoreId, setActiveStoreId, user } = useApp();
  const title = NAV.find((n) => n.id === page)?.label || "Dashboard";
  return (
    <header className={cx("h-16 shrink-0 flex items-center gap-3 px-3.5 sm:px-6 border-b sticky top-0 z-30 backdrop-blur-lg", dark ? "bg-slate-950/90 border-slate-800" : "bg-slate-50/90 border-slate-200")}>
      <button onClick={onMenu} className={cx("lg:hidden p-2 rounded-lg", dark ? "bg-slate-800" : "bg-white border border-slate-200")}><Menu size={17} /></button>
      <div className="min-w-0 flex-1">
        <h1 className="font-display font-bold text-base sm:text-lg truncate">{title}</h1>
      </div>
      <Select value={activeStoreId} onChange={(e) => setActiveStoreId(e.target.value)} className="!py-2 !text-xs w-32 sm:w-48 shrink-0">
        <option value="all">Semua Toko</option>
        {db.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <button onClick={() => setDark((d) => !d)} className={cx("p-2 rounded-lg shrink-0", dark ? "bg-slate-800 text-amber-300" : "bg-white text-slate-600 border border-slate-200")}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button onClick={onLogout} className={cx("hidden sm:flex p-2 rounded-lg shrink-0", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200")} title="Keluar">
        <LogOut size={16} />
      </button>
    </header>
  );
}

function PageRouter({ page, setPage, notify }) {
  switch (page) {
    case "dashboard": return <Dashboard goto={setPage} />;
    case "sales": return <SalesPage />;
    case "expense": return <ExpensePage />;
    case "handover": return <HandoverPage />;
    case "history": return <HistoryPage />;
    case "reports": return <ReportsPage />;
    case "products": return <ProductsPage />;
    case "stores": return <StoresPage />;
    case "settings": return <SettingsPage />;
    default: return null;
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function useComputedStats(storeId, period, custom) {
  const { db } = useApp();
  return useMemo(() => {
    const range = periodRange(period, custom);
    const storeIds = storeId === "all" ? db.stores.map((s) => s.id) : [storeId];
    const sales = db.sales.filter((s) => storeIds.includes(s.storeId) && inRange(s.date, range));
    const expenses = db.expenses.filter((e) => storeIds.includes(e.storeId) && inRange(e.date, range));
    const handovers = db.handovers.filter((h) => storeIds.includes(h.storeId) && inRange(h.date, range));

    const totalIncome = sales.reduce((a, s) => a + s.total, 0);
    const totalExpense = expenses.reduce((a, e) => a + e.amount, 0);
    const profit = totalIncome - totalExpense;
    const totalHandover = handovers.reduce((a, h) => a + h.amount, 0);
    const notHandedOver = Math.max(profit - totalHandover, 0);

    const totalCapital = db.stores.filter((s) => storeIds.includes(s.id)).reduce((a, s) => a + s.initialCapital, 0);
    // saldo = initial balance + all-time income - all-time expense - all-time handover (not limited to period)
    const allSales = db.sales.filter((s) => storeIds.includes(s.storeId));
    const allExpenses = db.expenses.filter((e) => storeIds.includes(e.storeId));
    const allHandovers = db.handovers.filter((h) => storeIds.includes(h.storeId));
    const initialBalance = db.stores.filter((s) => storeIds.includes(s.id)).reduce((a, s) => a + s.initialBalance, 0);
    const saldo = initialBalance + allSales.reduce((a, s) => a + s.total, 0) - allExpenses.reduce((a, e) => a + e.amount, 0) - allHandovers.reduce((a, h) => a + h.amount, 0);

    const methodTotals = {};
    PAYMENT_METHODS.forEach((m) => { methodTotals[m.id] = 0; });
    sales.forEach((s) => { methodTotals[s.method] += s.total; });

    // daily series across range
    const days = [];
    let cursor = new Date(range[0]);
    while (cursor <= range[1] && days.length < 370) {
      days.push(dayKey(cursor));
      cursor = addDays(cursor, 1);
    }
    const byDay = days.map((dk) => {
      const dSales = sales.filter((s) => dayKey(s.date) === dk).reduce((a, s) => a + s.total, 0);
      const dExp = expenses.filter((e) => dayKey(e.date) === dk).reduce((a, e) => a + e.amount, 0);
      return { day: dk, label: new Date(dk).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), income: dSales, expense: dExp, profit: dSales - dExp };
    });

    const perStore = db.stores.map((s) => {
      const ss = db.sales.filter((x) => x.storeId === s.id && inRange(x.date, range));
      const se = db.expenses.filter((x) => x.storeId === s.id && inRange(x.date, range));
      const income = ss.reduce((a, x) => a + x.total, 0);
      const expense = se.reduce((a, x) => a + x.amount, 0);
      return { store: s, income, expense, profit: income - expense, txCount: ss.length };
    });

    return { range, sales, expenses, handovers, totalIncome, totalExpense, profit, totalHandover, notHandedOver, totalCapital, saldo, methodTotals, byDay, perStore };
  }, [db, storeId, period, custom]);
}

function Dashboard({ goto }) {
  const { dark, db, activeStoreId, currentStore } = useApp();
  const [period, setPeriod] = useState("month");
  const [custom, setCustom] = useState({ from: dayKey(addDays(new Date(), -7)), to: dayKey(new Date()) });
  const stats = useComputedStats(activeStoreId, period, custom);

  const isAll = activeStoreId === "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-display font-extrabold text-xl">{isAll ? "Ringkasan Semua Toko" : currentStore?.name}</p>
          <p className={cx("text-xs mt-0.5", dark ? "text-slate-400" : "text-slate-500")}>
            {isAll ? `${db.stores.filter(s=>s.status==='active').length} toko aktif` : currentStore?.address}
          </p>
        </div>
        <PeriodFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} tone="green" label="Total Pemasukan" value={fmtIDR(stats.totalIncome)} sub={<><ArrowUpRight size={12} className="text-emerald-500" /> {stats.sales.length} transaksi</>} delay={0} />
        <StatCard icon={TrendingDown} tone="red" label="Total Pengeluaran" value={fmtIDR(stats.totalExpense)} sub={<><ArrowDownRight size={12} className="text-rose-500" /> {stats.expenses.length} catatan</>} delay={40} />
        <StatCard icon={PiggyBank} tone="indigo" label="Total Keuntungan" value={fmtIDR(stats.profit)} sub={`Margin ${stats.totalIncome > 0 ? ((stats.profit / stats.totalIncome) * 100).toFixed(1) : 0}%`} delay={80} />
        <StatCard icon={Wallet} tone="amber" label="Saldo Toko" value={fmtIDR(stats.saldo)} sub={`Modal ${fmtIDRshort(stats.totalCapital)}`} delay={120} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CheckCircle2} tone="green" label="Sudah Diserahkan" value={fmtIDR(stats.totalHandover)} delay={0} />
        <StatCard icon={AlertCircle} tone="amber" label="Belum Diserahkan" value={fmtIDR(stats.notHandedOver)} delay={40} />
        <StatCard icon={ShoppingCart} tone="indigo" label="Rata-rata / Transaksi" value={fmtIDR(stats.sales.length ? stats.totalIncome / stats.sales.length : 0)} delay={80} />
        <StatCard icon={Boxes} tone="indigo" label="Total Toko" value={String(db.stores.length)} sub={`${db.stores.filter(s=>s.status==='active').length} aktif`} delay={120} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-sm">Pemasukan vs Pengeluaran</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pemasukan</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Pengeluaran</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.byDay}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#f1f5f9"} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} tickFormatter={fmtIDRshort} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incGrad)" />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="font-display font-bold text-sm mb-3">Metode Pembayaran</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PAYMENT_METHODS.map((m) => ({ name: m.label, value: stats.methodTotals[m.id] })).filter((d) => d.value > 0)}
                dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                {PAYMENT_METHODS.map((m, i) => <Cell key={m.id} fill={m.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {PAYMENT_METHODS.filter((m) => stats.methodTotals[m.id] > 0).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: m.color }} />{m.label}</span>
                <span className="font-semibold tabular">{fmtIDRshort(stats.methodTotals[m.id])}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {isAll && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-bold text-sm">Perbandingan Performa Antar Toko</p>
            <Badge tone="indigo"><Sparkles size={11} /> Konsolidasi</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.perStore.map((p) => ({ name: p.store.name.split(" - ")[0], income: p.income, expense: p.expense, profit: p.profit }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#f1f5f9"} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} tickFormatter={fmtIDRshort} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "none" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Keuntungan" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {stats.perStore.map((p) => (
              <button key={p.store.id} onClick={() => goto && goto("dashboard")} className={cx("text-left p-3 rounded-xl border", dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-100 hover:bg-slate-50")}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.store.logoColor }} />
                  <span className="text-xs font-semibold truncate">{p.store.name}</span>
                </div>
                <p className="font-display font-bold text-sm tabular">{fmtIDR(p.profit)}</p>
                <p className={cx("text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>{p.txCount} transaksi · {fmtIDRshort(p.income)} penjualan</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {!isAll && currentStore && <StoreDetailExtra storeId={activeStoreId} period={period} custom={custom} stats={stats} />}
    </div>
  );
}

function StoreDetailExtra({ storeId, stats }) {
  const { dark, db } = useApp();
  const store = db.stores.find((s) => s.id === storeId);
  const receivables = 0; // no piutang demo data
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 sm:p-5">
        <p className="font-display font-bold text-sm mb-3">Cash Flow Harian</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#f1f5f9"} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} tickFormatter={fmtIDRshort} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "none" }} />
            <Line type="monotone" dataKey="profit" name="Keuntungan" stroke="#4F46E5" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-4 sm:p-5">
        <p className="font-display font-bold text-sm mb-3">Info Toko</p>
        <div className="space-y-2.5 text-sm">
          <Row label="Pemilik" value={store.owner} />
          <Row label="Penanggung jawab" value={store.pic} />
          <Row label="No. WhatsApp" value={`+${store.whatsapp}`} />
          <Row label="Modal awal" value={fmtIDR(store.initialCapital)} />
          <Row label="Piutang" value={fmtIDR(receivables)} />
          <Row label="Status" value={<Badge tone={store.status === "active" ? "green" : "neutral"}>{store.status === "active" ? "Aktif" : "Nonaktif"}</Badge>} />
        </div>
      </Card>
    </div>
  );
}
function Row({ label, value }) {
  const { dark } = useApp();
  return (
    <div className="flex items-center justify-between">
      <span className={cx("text-xs", dark ? "text-slate-400" : "text-slate-500")}>{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

/* ============================================================
   SALES PAGE
   ============================================================ */
function SalesPage() {
  const { dark, db, setDb, activeStoreId, notify, activeStores } = useApp();
  const [storeId, setStoreId] = useState(activeStoreId !== "all" ? activeStoreId : activeStores[0]?.id || "");
  const [items, setItems] = useState([{ id: uid("li"), productId: "", qty: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [cashier, setCashier] = useState("");
  const [notes, setNotes] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [waOpen, setWaOpen] = useState(false);

  const store = db.stores.find((s) => s.id === storeId);
  const products = db.products.filter((p) => p.storeId === storeId && p.status === "active");

  const lineItems = items.map((li) => {
    const p = products.find((x) => x.id === li.productId);
    const total = p ? p.price * li.qty : 0;
    return { ...li, product: p, total };
  });
  const subtotal = lineItems.reduce((a, li) => a + li.total, 0);
  const grandTotal = Math.max(subtotal - (Number(discount) || 0), 0);

  const addLine = () => setItems((prev) => [...prev, { id: uid("li"), productId: "", qty: 1 }]);
  const removeLine = (id) => setItems((prev) => prev.filter((x) => x.id !== id));
  const updateLine = (id, patch) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const canSave = storeId && lineItems.some((li) => li.product && li.qty > 0) && cashier.trim();

  const save = () => {
    if (!canSave) { notify("Lengkapi form terlebih dahulu", "red"); return; }
    const now = new Date();
    const txCount = db.sales.filter((s) => s.storeId === storeId && dayKey(s.date) === dayKey(now)).length + 1;
    const sale = {
      id: uid("sale"), storeId, date: now.toISOString(),
      txNumber: `TRX-${storeId.slice(3).toUpperCase()}-${dayKey(now).replace(/-/g, "")}-${String(txCount).padStart(3, "0")}`,
      items: lineItems.filter((li) => li.product).map((li) => ({ productId: li.product.id, name: li.product.name, qty: li.qty, price: li.product.price, cost: li.product.cost, total: li.total })),
      subtotal, discount: Number(discount) || 0, total: grandTotal, method, cashier, notes,
    };
    setDb((d) => ({
      ...d,
      sales: [sale, ...d.sales],
      products: d.products.map((p) => {
        const li = sale.items.find((x) => x.productId === p.id);
        return li ? { ...p, stock: Math.max(p.stock - li.qty, 0) } : p;
      }),
    }));
    setLastSale(sale);
    setItems([{ id: uid("li"), productId: "", qty: 1 }]);
    setDiscount(0); setNotes("");
    notify("Transaksi tersimpan — saldo & keuntungan diperbarui");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="p-4 sm:p-5 lg:col-span-2 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Toko" required>
            <Select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">Pilih toko</option>
              {activeStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Nama kasir" required>
            <Input value={cashier} onChange={(e) => setCashier(e.target.value)} placeholder="cth. Rani" />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={cx("block text-xs font-semibold", dark ? "text-slate-300" : "text-slate-600")}>Produk / Menu <span className="text-rose-500">*</span></span>
            <button onClick={addLine} className="text-indigo-500 text-xs font-semibold flex items-center gap-1"><Plus size={13} /> Tambah item</button>
          </div>
          <div className="space-y-2">
            {lineItems.map((li) => (
              <div key={li.id} className="flex items-center gap-2">
                <Select value={li.productId} onChange={(e) => updateLine(li.id, { productId: e.target.value })} className="flex-1">
                  <option value="">Pilih produk</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtIDR(p.price)}</option>)}
                </Select>
                <Input type="number" min={1} value={li.qty} onChange={(e) => updateLine(li.id, { qty: Number(e.target.value) || 1 })} className="w-16 text-center" />
                <span className="text-xs font-semibold tabular w-20 text-right shrink-0">{fmtIDRshort(li.total)}</span>
                <button onClick={() => removeLine(li.id)} className="p-1.5 text-slate-400 hover:text-rose-500 shrink-0"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {!storeId && <p className="text-[11px] text-amber-500 mt-2">Pilih toko dahulu untuk melihat daftar produk.</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Diskon (Rp)"><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          <Field label="Catatan"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" /></Field>
        </div>

        <div>
          <span className={cx("block text-xs font-semibold mb-2", dark ? "text-slate-300" : "text-slate-600")}>Metode pembayaran</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={cx("flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[11px] font-semibold transition",
                  method === m.id ? "border-indigo-500 bg-indigo-500/10 text-indigo-500" : dark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500")}>
                <m.icon size={16} /> {m.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <p className="font-display font-bold text-sm mb-3">Ringkasan</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className={dark ? "text-slate-400" : "text-slate-500"}>Subtotal</span><span className="tabular font-medium">{fmtIDR(subtotal)}</span></div>
            <div className="flex justify-between"><span className={dark ? "text-slate-400" : "text-slate-500"}>Diskon</span><span className="tabular font-medium text-rose-500">-{fmtIDR(discount)}</span></div>
            <div className={cx("flex justify-between pt-2 border-t", dark ? "border-slate-700" : "border-slate-100")}>
              <span className="font-display font-bold">Grand Total</span><span className="font-display font-extrabold text-emerald-500 tabular">{fmtIDR(grandTotal)}</span>
            </div>
          </div>
          <Btn variant="green" className="w-full mt-4" onClick={save} disabled={!canSave}>
            <CheckCircle2 size={16} /> Simpan Transaksi
          </Btn>
        </Card>

        {lastSale && (
          <Card className="p-4 sm:p-5 animate-fadeUp">
            <div className="flex items-center gap-2 mb-2 text-emerald-500"><CheckCircle2 size={16} /><p className="text-sm font-semibold">Transaksi tersimpan</p></div>
            <p className={cx("text-xs mb-3", dark ? "text-slate-400" : "text-slate-500")}>{lastSale.txNumber} · {fmtIDR(lastSale.total)}</p>
            <Btn variant="green" size="sm" className="w-full" onClick={() => setWaOpen(true)}><Send size={14} /> Kirim Laporan WhatsApp</Btn>
          </Card>
        )}
      </div>

      <Modal open={waOpen} onClose={() => setWaOpen(false)} title="Kirim Laporan WhatsApp">
        {lastSale && (
          <div className="space-y-4">
            <pre className={cx("text-xs whitespace-pre-wrap p-3 rounded-xl border font-body", dark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
              {buildWaMessage({ storeName: store?.name, date: lastSale.date, sales: [lastSale], expenses: [], handoverAmount: 0 })}
            </pre>
            <WhatsAppSendRow message={buildWaMessage({ storeName: store?.name, date: lastSale.date, sales: [lastSale], expenses: [], handoverAmount: 0 })} store={store} />
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================
   EXPENSE PAGE
   ============================================================ */
function ExpensePage() {
  const { db, setDb, activeStoreId, notify, activeStores } = useApp();
  const [storeId, setStoreId] = useState(activeStoreId !== "all" ? activeStoreId : activeStores[0]?.id || "");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [by, setBy] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState(null);
  const fileRef = useRef(null);

  const canSave = storeId && Number(amount) > 0 && by.trim();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setProof(reader.result);
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (!canSave) { notify("Lengkapi form terlebih dahulu", "red"); return; }
    const exp = { id: uid("exp"), storeId, date: new Date().toISOString(), category, amount: Number(amount), method, description, by, notes, proof };
    setDb((d) => ({ ...d, expenses: [exp, ...d.expenses] }));
    setAmount(""); setDescription(""); setNotes(""); setProof(null); setBy("");
    notify("Pengeluaran tersimpan — saldo diperbarui", "red");
  };

  return (
    <div className="max-w-xl">
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Toko" required>
            <Select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">Pilih toko</option>
              {activeStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Kategori" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Nominal (Rp)" required><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Metode pembayaran">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.slice(0, 2).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </Select>
          </Field>
          <Field label="Dilakukan oleh" required><Input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Nama" /></Field>
        </div>
        <Field label="Deskripsi"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Keterangan pengeluaran" /></Field>
        <Field label="Bukti pembayaran / nota">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          {proof ? (
            <div className="relative w-28">
              <img src={proof} className="w-28 h-28 object-cover rounded-xl border" alt="bukti" />
              <button onClick={() => setProof(null)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1"><X size={12} /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-1.5 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition">
              <ImagePlus size={20} /> <span className="text-xs font-medium">Unggah foto nota</span>
            </button>
          )}
        </Field>
        <Field label="Catatan"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Btn variant="red" className="w-full" onClick={save} disabled={!canSave}><CheckCircle2 size={16} /> Simpan Pengeluaran</Btn>
      </Card>
    </div>
  );
}

/* ============================================================
   HANDOVER PAGE
   ============================================================ */
function HandoverPage() {
  const { dark, db, setDb, activeStoreId, notify, activeStores } = useApp();
  const [storeId, setStoreId] = useState(activeStoreId !== "all" ? activeStoreId : activeStores[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(HANDOVER_TYPES[0]);
  const [by, setBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const store = db.stores.find((s) => s.id === storeId);
  const todaySales = db.sales.filter((s) => s.storeId === storeId && dayKey(s.date) === dayKey(new Date()));
  const todayExpenses = db.expenses.filter((e) => e.storeId === storeId && dayKey(e.date) === dayKey(new Date()));
  const todayHandovers = db.handovers.filter((h) => h.storeId === storeId && dayKey(h.date) === dayKey(new Date()));
  const todayProfit = todaySales.reduce((a, s) => a + s.total, 0) - todayExpenses.reduce((a, e) => a + e.amount, 0);
  const todayHanded = todayHandovers.reduce((a, h) => a + h.amount, 0);
  const remaining = todayProfit - todayHanded;

  const canSave = storeId && Number(amount) > 0 && by.trim() && receivedBy.trim();
  const save = () => {
    if (!canSave) { notify("Lengkapi form terlebih dahulu", "red"); return; }
    const hd = { id: uid("hd"), storeId, date: new Date().toISOString(), amount: Number(amount), type, by, receivedBy, method, notes, proof: null };
    setDb((d) => ({ ...d, handovers: [hd, ...d.handovers] }));
    setAmount(""); setNotes(""); setBy(""); setReceivedBy("");
    notify("Serahan tercatat");
  };

  const allStoreStatus = activeStores.map((s) => {
    const sales = db.sales.filter((x) => x.storeId === s.id && dayKey(x.date) === dayKey(new Date()));
    const exp = db.expenses.filter((x) => x.storeId === s.id && dayKey(x.date) === dayKey(new Date()));
    const hd = db.handovers.filter((x) => x.storeId === s.id && dayKey(x.date) === dayKey(new Date()));
    const profit = sales.reduce((a, x) => a + x.total, 0) - exp.reduce((a, x) => a + x.amount, 0);
    const handed = hd.reduce((a, x) => a + x.amount, 0);
    let status = "red"; if (handed >= profit && profit > 0) status = "green"; else if (handed > 0) status = "yellow";
    return { store: s, profit, handed, remaining: Math.max(profit - handed, 0), status };
  });

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="p-4 sm:p-5 lg:col-span-2 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Toko" required>
            <Select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">Pilih toko</option>
              {activeStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Jenis" required>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {HANDOVER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Nominal (Rp)" required><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Diserahkan oleh" required><Input value={by} onChange={(e) => setBy(e.target.value)} placeholder={store?.pic || "Nama"} /></Field>
          <Field label="Diterima oleh" required><Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder={store?.owner || "Nama"} /></Field>
        </div>
        <Field label="Metode">
          <div className="flex gap-2">
            {["cash", "transfer"].map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={cx("flex-1 py-2.5 rounded-xl border text-xs font-semibold capitalize", method === m ? "border-indigo-500 bg-indigo-500/10 text-indigo-500" : dark ? "border-slate-700" : "border-slate-200")}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Catatan"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Btn variant="primary" className="w-full" onClick={save} disabled={!canSave}><HandCoins size={16} /> Catat Serahan</Btn>
      </Card>

      <div className="space-y-4">
        {storeId && (
          <Card className="p-4 sm:p-5">
            <p className="font-display font-bold text-sm mb-3">Ringkasan Hari Ini</p>
            <Row label="Keuntungan" value={fmtIDR(todayProfit)} />
            <div className="h-2" />
            <Row label="Sudah diserahkan" value={fmtIDR(todayHanded)} />
            <div className="h-2" />
            <Row label="Sisa" value={<span className={remaining > 0 ? "text-amber-500" : "text-emerald-500"}>{fmtIDR(remaining)}</span>} />
          </Card>
        )}
        <Card className="p-4 sm:p-5">
          <p className="font-display font-bold text-sm mb-3">Status Serahan Semua Toko</p>
          <div className="space-y-2.5">
            {allStoreStatus.map((s) => (
              <div key={s.store.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  {s.status === "green" ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : s.status === "yellow" ? <Circle size={14} className="text-amber-500 fill-amber-500 shrink-0" /> : <AlertCircle size={14} className="text-rose-500 shrink-0" />}
                  {s.store.name}
                </span>
                <span className="tabular font-semibold">{fmtIDRshort(s.remaining)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   HISTORY PAGE
   ============================================================ */
function HistoryPage() {
  const { dark, db, setDb, activeStoreId, notify } = useApp();
  const [tab, setTab] = useState("sales");
  const [q, setQ] = useState("");
  const [storeFilter, setStoreFilter] = useState(activeStoreId);
  const [methodFilter, setMethodFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [period, setPeriod] = useState("month");
  const [custom, setCustom] = useState({ from: dayKey(addDays(new Date(), -30)), to: dayKey(new Date()) });
  const [detail, setDetail] = useState(null);

  const range = periodRange(period, custom);
  const storeName = (id) => db.stores.find((s) => s.id === id)?.name || "-";

  const salesRows = useMemo(() => db.sales.filter((s) =>
    (storeFilter === "all" || s.storeId === storeFilter) &&
    inRange(s.date, range) &&
    (methodFilter === "all" || s.method === methodFilter) &&
    (q === "" || s.txNumber.toLowerCase().includes(q.toLowerCase()) || s.cashier.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)), [db.sales, storeFilter, range, methodFilter, q]);

  const expenseRows = useMemo(() => db.expenses.filter((e) =>
    (storeFilter === "all" || e.storeId === storeFilter) &&
    inRange(e.date, range) &&
    (catFilter === "all" || e.category === catFilter) &&
    (q === "" || e.description.toLowerCase().includes(q.toLowerCase()) || e.by.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)), [db.expenses, storeFilter, range, catFilter, q]);

  const handoverRows = useMemo(() => db.handovers.filter((h) =>
    (storeFilter === "all" || h.storeId === storeFilter) && inRange(h.date, range) &&
    (q === "" || h.by.toLowerCase().includes(q.toLowerCase()) || h.receivedBy.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)), [db.handovers, storeFilter, range, q]);

  const removeSale = (id) => { if (confirm("Hapus transaksi ini?")) { setDb((d) => ({ ...d, sales: d.sales.filter((s) => s.id !== id) })); notify("Transaksi dihapus", "red"); } };
  const removeExpense = (id) => { if (confirm("Hapus pengeluaran ini?")) { setDb((d) => ({ ...d, expenses: d.expenses.filter((s) => s.id !== id) })); notify("Pengeluaran dihapus", "red"); } };
  const removeHandover = (id) => { if (confirm("Hapus serahan ini?")) { setDb((d) => ({ ...d, handovers: d.handovers.filter((s) => s.id !== id) })); notify("Serahan dihapus", "red"); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className={cx("flex p-1 rounded-xl", dark ? "bg-slate-800" : "bg-slate-100")}>
          {[["sales", "Penjualan"], ["expense", "Pengeluaran"], ["handover", "Serahan"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cx("px-3.5 py-1.5 rounded-lg text-xs font-semibold transition", tab === id ? "bg-indigo-600 text-white shadow" : dark ? "text-slate-300" : "text-slate-600")}>{label}</button>
          ))}
        </div>
        <PeriodFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className={cx("absolute left-3 top-1/2 -translate-y-1/2", dark ? "text-slate-500" : "text-slate-400")} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" className="!pl-9" />
          </div>
          <Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="w-40"><option value="all">Semua Toko</option>{db.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          {tab === "sales" && <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-36"><option value="all">Semua Metode</option>{PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</Select>}
          {tab === "expense" && <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-40"><option value="all">Semua Kategori</option>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}
          <Btn variant="ghost" size="sm" onClick={() => exportCSV(tab, tab === "sales" ? salesRows : tab === "expense" ? expenseRows : handoverRows, storeName)}><Download size={13} /> Export</Btn>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {tab === "sales" && (
          salesRows.length === 0 ? <EmptyState icon={ShoppingCart} title="Belum ada transaksi" desc="Transaksi penjualan pada periode ini akan muncul di sini." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={cx("text-[11px] uppercase tracking-wide", dark ? "text-slate-400 bg-slate-800/50" : "text-slate-500 bg-slate-50")}>
                  <tr><Th>No. Transaksi</Th><Th>Toko</Th><Th>Tanggal</Th><Th>Metode</Th><Th className="text-right">Total</Th><Th className="text-right">Aksi</Th></tr>
                </thead>
                <tbody>
                  {salesRows.map((s) => (
                    <tr key={s.id} className={cx("border-t", dark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50")}>
                      <Td className="font-medium">{s.txNumber}</Td>
                      <Td>{storeName(s.storeId)}</Td>
                      <Td>{fmtDateTime(s.date)}</Td>
                      <Td><Badge tone="indigo">{PAYMENT_METHODS.find((m) => m.id === s.method)?.label}</Badge></Td>
                      <Td className="text-right font-semibold tabular text-emerald-500">{fmtIDR(s.total)}</Td>
                      <Td className="text-right"><RowActions onView={() => setDetail({ type: "sales", data: s })} onDelete={() => removeSale(s.id)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {tab === "expense" && (
          expenseRows.length === 0 ? <EmptyState icon={Receipt} title="Belum ada pengeluaran" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={cx("text-[11px] uppercase tracking-wide", dark ? "text-slate-400 bg-slate-800/50" : "text-slate-500 bg-slate-50")}>
                  <tr><Th>Kategori</Th><Th>Toko</Th><Th>Tanggal</Th><Th>Oleh</Th><Th className="text-right">Nominal</Th><Th className="text-right">Aksi</Th></tr>
                </thead>
                <tbody>
                  {expenseRows.map((e) => (
                    <tr key={e.id} className={cx("border-t", dark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50")}>
                      <Td className="font-medium">{e.category}</Td>
                      <Td>{storeName(e.storeId)}</Td>
                      <Td>{fmtDateTime(e.date)}</Td>
                      <Td>{e.by}</Td>
                      <Td className="text-right font-semibold tabular text-rose-500">-{fmtIDR(e.amount)}</Td>
                      <Td className="text-right"><RowActions onView={() => setDetail({ type: "expense", data: e })} onDelete={() => removeExpense(e.id)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {tab === "handover" && (
          handoverRows.length === 0 ? <EmptyState icon={HandCoins} title="Belum ada serahan" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={cx("text-[11px] uppercase tracking-wide", dark ? "text-slate-400 bg-slate-800/50" : "text-slate-500 bg-slate-50")}>
                  <tr><Th>Jenis</Th><Th>Toko</Th><Th>Tanggal</Th><Th>Diserahkan / Diterima</Th><Th className="text-right">Nominal</Th><Th className="text-right">Aksi</Th></tr>
                </thead>
                <tbody>
                  {handoverRows.map((h) => (
                    <tr key={h.id} className={cx("border-t", dark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50")}>
                      <Td className="font-medium">{h.type}</Td>
                      <Td>{storeName(h.storeId)}</Td>
                      <Td>{fmtDateTime(h.date)}</Td>
                      <Td>{h.by} → {h.receivedBy}</Td>
                      <Td className="text-right font-semibold tabular text-indigo-500">{fmtIDR(h.amount)}</Td>
                      <Td className="text-right"><RowActions onView={() => setDetail({ type: "handover", data: h })} onDelete={() => removeHandover(h.id)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Transaksi" wide>
        {detail?.type === "sales" && (
          <div className="space-y-3 text-sm">
            <Row label="No. Transaksi" value={detail.data.txNumber} />
            <Row label="Toko" value={storeName(detail.data.storeId)} />
            <Row label="Tanggal" value={fmtDateTime(detail.data.date)} />
            <Row label="Kasir" value={detail.data.cashier} />
            <div className={cx("rounded-xl border p-3 mt-2", dark ? "border-slate-700" : "border-slate-200")}>
              {detail.data.items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs py-1"><span>{it.qty}× {it.name}</span><span className="tabular">{fmtIDR(it.total)}</span></div>
              ))}
            </div>
            <Row label="Diskon" value={fmtIDR(detail.data.discount)} />
            <Row label="Total" value={<span className="text-emerald-500 font-bold">{fmtIDR(detail.data.total)}</span>} />
            <Row label="Metode" value={PAYMENT_METHODS.find((m) => m.id === detail.data.method)?.label} />
          </div>
        )}
        {detail?.type === "expense" && (
          <div className="space-y-3 text-sm">
            <Row label="Kategori" value={detail.data.category} />
            <Row label="Toko" value={storeName(detail.data.storeId)} />
            <Row label="Tanggal" value={fmtDateTime(detail.data.date)} />
            <Row label="Nominal" value={<span className="text-rose-500 font-bold">{fmtIDR(detail.data.amount)}</span>} />
            <Row label="Dilakukan oleh" value={detail.data.by} />
            <Row label="Deskripsi" value={detail.data.description || "-"} />
            {detail.data.proof && <img src={detail.data.proof} className="rounded-xl border w-full max-w-[200px]" alt="bukti" />}
          </div>
        )}
        {detail?.type === "handover" && (
          <div className="space-y-3 text-sm">
            <Row label="Jenis" value={detail.data.type} />
            <Row label="Toko" value={storeName(detail.data.storeId)} />
            <Row label="Tanggal" value={fmtDateTime(detail.data.date)} />
            <Row label="Nominal" value={<span className="text-indigo-500 font-bold">{fmtIDR(detail.data.amount)}</span>} />
            <Row label="Diserahkan oleh" value={detail.data.by} />
            <Row label="Diterima oleh" value={detail.data.receivedBy} />
          </div>
        )}
      </Modal>
    </div>
  );
}
function Th({ children, className }) { return <th className={cx("text-left font-semibold px-4 py-2.5", className)}>{children}</th>; }
function Td({ children, className }) { return <td className={cx("px-4 py-2.5 align-middle", className)}>{children}</td>; }
function RowActions({ onView, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={onView} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500"><Edit2 size={13} /></button>
      <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"><Trash2 size={13} /></button>
    </div>
  );
}

function exportCSV(kind, rows, storeName) {
  let header = [], lines = [];
  if (kind === "sales") {
    header = ["No Transaksi", "Toko", "Tanggal", "Kasir", "Metode", "Subtotal", "Diskon", "Total"];
    lines = rows.map((s) => [s.txNumber, storeName(s.storeId), fmtDateTime(s.date), s.cashier, s.method, s.subtotal, s.discount, s.total]);
  } else if (kind === "expense") {
    header = ["Kategori", "Toko", "Tanggal", "Oleh", "Metode", "Nominal", "Deskripsi"];
    lines = rows.map((e) => [e.category, storeName(e.storeId), fmtDateTime(e.date), e.by, e.method, e.amount, e.description]);
  } else {
    header = ["Jenis", "Toko", "Tanggal", "Diserahkan Oleh", "Diterima Oleh", "Metode", "Nominal"];
    lines = rows.map((h) => [h.type, storeName(h.storeId), fmtDateTime(h.date), h.by, h.receivedBy, h.method, h.amount]);
  }
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `toko-finance-${kind}-${dayKey(new Date())}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   REPORTS PAGE
   ============================================================ */
function ReportsPage() {
  const { dark, db, activeStoreId } = useApp();
  const [tab, setTab] = useState("daily");
  const [date, setDate] = useState(dayKey(new Date()));
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [storeId, setStoreId] = useState(activeStoreId !== "all" ? activeStoreId : db.stores[0]?.id);
  const [waOpen, setWaOpen] = useState(false);

  const store = db.stores.find((s) => s.id === storeId);
  const dayRange = [startOfDay(new Date(date)), endOfDay(new Date(date))];
  const daySales = db.sales.filter((s) => s.storeId === storeId && inRange(s.date, dayRange));
  const dayExpenses = db.expenses.filter((e) => e.storeId === storeId && inRange(e.date, dayRange));
  const dayHandovers = db.handovers.filter((h) => h.storeId === storeId && inRange(h.date, dayRange));
  const dayIncome = daySales.reduce((a, s) => a + s.total, 0);
  const dayExp = dayExpenses.reduce((a, e) => a + e.amount, 0);
  const dayProfit = dayIncome - dayExp;
  const dayHanded = dayHandovers.reduce((a, h) => a + h.amount, 0);

  const monthRange = [startOfDay(new Date(year, month, 1)), endOfDay(new Date(year, month + 1, 0))];
  const prevMonthRange = [startOfDay(new Date(year, month - 1, 1)), endOfDay(new Date(year, month, 0))];
  const mSales = db.sales.filter((s) => s.storeId === storeId && inRange(s.date, monthRange));
  const mExpenses = db.expenses.filter((e) => e.storeId === storeId && inRange(e.date, monthRange));
  const mHandovers = db.handovers.filter((h) => h.storeId === storeId && inRange(h.date, monthRange));
  const pSales = db.sales.filter((s) => s.storeId === storeId && inRange(s.date, prevMonthRange));
  const pExpenses = db.expenses.filter((e) => e.storeId === storeId && inRange(e.date, prevMonthRange));
  const mIncome = mSales.reduce((a, s) => a + s.total, 0), mExp = mExpenses.reduce((a, e) => a + e.amount, 0);
  const pIncome = pSales.reduce((a, s) => a + s.total, 0), pExp = pExpenses.reduce((a, e) => a + e.amount, 0);
  const mProfit = mIncome - mExp, pProfit = pIncome - pExp;
  const growth = pProfit !== 0 ? (((mProfit - pProfit) / Math.abs(pProfit)) * 100).toFixed(1) : "—";

  const consolidated = db.stores.map((s) => {
    const ss = db.sales.filter((x) => x.storeId === s.id && inRange(x.date, monthRange));
    const se = db.expenses.filter((x) => x.storeId === s.id && inRange(x.date, monthRange));
    const income = ss.reduce((a, x) => a + x.total, 0), exp = se.reduce((a, x) => a + x.amount, 0);
    return { store: s, income, expense: exp, profit: income - exp };
  });

  const doPrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className={cx("flex p-1 rounded-xl", dark ? "bg-slate-800" : "bg-slate-100")}>
          {[["daily", "Harian"], ["monthly", "Bulanan"], ["consolidated", "Semua Toko"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cx("px-3.5 py-1.5 rounded-lg text-xs font-semibold transition", tab === id ? "bg-indigo-600 text-white shadow" : dark ? "text-slate-300" : "text-slate-600")}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={doPrint}><Printer size={13} /> Cetak / PDF</Btn>
        </div>
      </div>

      {tab === "daily" && (
        <Card className="p-4 sm:p-6 max-w-lg">
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-44">{db.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <div className="text-center mb-4">
            <p className="font-display font-extrabold text-lg">LAPORAN HARIAN</p>
            <p className={cx("text-sm", dark ? "text-slate-400" : "text-slate-500")}>{store?.name}</p>
            <p className={cx("text-xs", dark ? "text-slate-500" : "text-slate-400")}>{fmtDate(date)}</p>
          </div>
          <div className={cx("rounded-xl divide-y", dark ? "divide-slate-700 border border-slate-700" : "divide-slate-100 border border-slate-200")}>
            <ReportRow label="Penjualan" value={fmtIDR(dayIncome)} tone="green" />
            <ReportRow label="Pengeluaran" value={fmtIDR(dayExp)} tone="red" />
            <ReportRow label="Keuntungan" value={fmtIDR(dayProfit)} tone="indigo" bold />
            <ReportRow label="Sudah diserahkan" value={fmtIDR(dayHanded)} />
            <ReportRow label="Belum diserahkan" value={fmtIDR(Math.max(dayProfit - dayHanded, 0))} tone="amber" />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Btn variant="ghost" size="sm" onClick={doPrint}><Printer size={13} /> Cetak</Btn>
            <Btn variant="ghost" size="sm" onClick={() => exportCSV("sales", daySales, () => store?.name)}><Download size={13} /> Excel</Btn>
            <Btn variant="green" size="sm" onClick={() => setWaOpen(true)}><Send size={13} /> Kirim WhatsApp</Btn>
          </div>
        </Card>
      )}

      {tab === "monthly" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-44">{db.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-36">
              {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </Select>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} tone="green" label="Total Penjualan" value={fmtIDR(mIncome)} />
            <StatCard icon={TrendingDown} tone="red" label="Total Pengeluaran" value={fmtIDR(mExp)} />
            <StatCard icon={PiggyBank} tone="indigo" label="Keuntungan" value={fmtIDR(mProfit)} sub={`vs bulan lalu ${growth !== "—" ? growth + "%" : "—"}`} />
            <StatCard icon={HandCoins} tone="amber" label="Total Serahan" value={fmtIDR(mHandovers.reduce((a, h) => a + h.amount, 0))} />
          </div>
          <Card className="p-4 sm:p-5">
            <p className="font-display font-bold text-sm mb-3">Perbandingan Bulan Ini vs Bulan Lalu</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Penjualan", ini: mIncome, lalu: pIncome },
                { name: "Pengeluaran", ini: mExp, lalu: pExp },
                { name: "Keuntungan", ini: mProfit, lalu: pProfit },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }} tickFormatter={fmtIDRshort} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "none" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lalu" name="Bulan lalu" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ini" name="Bulan ini" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "consolidated" && (
        <Card className="p-4 sm:p-6">
          <p className="font-display font-extrabold text-lg mb-1">LAPORAN KONSOLIDASI — SEMUA TOKO</p>
          <p className={cx("text-xs mb-4", dark ? "text-slate-400" : "text-slate-500")}>{fmtDate(monthRange[0])} – {fmtDate(monthRange[1])}</p>
          <div className="space-y-2.5">
            {consolidated.map((c) => (
              <div key={c.store.id} className={cx("flex items-center justify-between p-3 rounded-xl border", dark ? "border-slate-700" : "border-slate-100")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.store.logoColor }} />
                  <div className="min-w-0"><p className="text-sm font-semibold truncate">{c.store.name}</p><p className={cx("text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>Penjualan {fmtIDR(c.income)}</p></div>
                </div>
                <p className="font-display font-bold text-sm text-emerald-500 tabular shrink-0">{fmtIDR(c.profit)}</p>
              </div>
            ))}
          </div>
          <div className={cx("flex items-center justify-between p-3.5 rounded-xl mt-3 font-display font-extrabold", dark ? "bg-indigo-500/10 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
            <span>TOTAL</span>
            <span className="tabular">{fmtIDR(consolidated.reduce((a, c) => a + c.profit, 0))}</span>
          </div>
        </Card>
      )}

      <Modal open={waOpen} onClose={() => setWaOpen(false)} title="Kirim Laporan Harian">
        <div className="space-y-4">
          <pre className={cx("text-xs whitespace-pre-wrap p-3 rounded-xl border font-body", dark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
            {buildWaMessage({ storeName: store?.name, date, sales: daySales, expenses: dayExpenses, handoverAmount: dayHanded })}
          </pre>
          <WhatsAppSendRow message={buildWaMessage({ storeName: store?.name, date, sales: daySales, expenses: dayExpenses, handoverAmount: dayHanded })} store={store} />
        </div>
      </Modal>
    </div>
  );
}
function ReportRow({ label, value, tone, bold }) {
  const { dark } = useApp();
  const colors = { green: "text-emerald-500", red: "text-rose-500", indigo: "text-indigo-500", amber: "text-amber-500" };
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className={cx("text-sm", dark ? "text-slate-400" : "text-slate-500")}>{label}</span>
      <span className={cx("text-sm tabular", bold ? "font-display font-extrabold text-base" : "font-semibold", tone && colors[tone])}>{value}</span>
    </div>
  );
}

/* ============================================================
   PRODUCTS / STOCK PAGE
   ============================================================ */
function ProductsPage() {
  const { dark, db, setDb, activeStoreId, notify, activeStores } = useApp();
  const [storeId, setStoreId] = useState(activeStoreId !== "all" ? activeStoreId : activeStores[0]?.id || "");
  const [modal, setModal] = useState(null); // {mode:'new'|'edit', data}
  const [stockModal, setStockModal] = useState(null);

  const products = db.products.filter((p) => p.storeId === storeId);
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  const openNew = () => setModal({ mode: "new", data: { name: "", sku: "", category: "Umum", price: "", cost: "", stock: 0, minStock: 5, status: "active" } });
  const openEdit = (p) => setModal({ mode: "edit", data: { ...p } });

  const saveProduct = (data) => {
    if (!data.name || !storeId) { notify("Nama produk wajib diisi", "red"); return; }
    if (modal.mode === "new") {
      setDb((d) => ({ ...d, products: [...d.products, { ...data, id: uid("prod"), storeId, price: Number(data.price), cost: Number(data.cost), stock: Number(data.stock), minStock: Number(data.minStock) }] }));
      notify("Produk ditambahkan");
    } else {
      setDb((d) => ({ ...d, products: d.products.map((p) => p.id === data.id ? { ...data, price: Number(data.price), cost: Number(data.cost), stock: Number(data.stock), minStock: Number(data.minStock) } : p) }));
      notify("Produk diperbarui");
    }
    setModal(null);
  };
  const removeProduct = (id) => { if (confirm("Hapus produk ini?")) { setDb((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) })); notify("Produk dihapus", "red"); } };

  const adjustStock = (id, delta, reason) => {
    setDb((d) => ({ ...d, products: d.products.map((p) => p.id === id ? { ...p, stock: Math.max(p.stock + delta, 0) } : p) }));
    notify(`Stok ${delta > 0 ? "masuk" : "keluar"} dicatat`);
    setStockModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-52">
          <option value="">Pilih toko</option>
          {activeStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Btn variant="primary" size="sm" onClick={openNew} disabled={!storeId}><Plus size={14} /> Tambah Produk</Btn>
      </div>

      {lowStock.length > 0 && (
        <div className={cx("flex items-center gap-2 p-3 rounded-xl border text-xs", dark ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700")}>
          <AlertTriangle size={15} className="shrink-0" /> {lowStock.length} produk stok menipis: {lowStock.map((p) => p.name).join(", ")}
        </div>
      )}

      <Card className="overflow-hidden">
        {!storeId ? <EmptyState icon={Package} title="Pilih toko untuk melihat produk" /> :
          products.length === 0 ? <EmptyState icon={Package} title="Belum ada produk" desc="Tambahkan produk pertama untuk toko ini." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cx("text-[11px] uppercase tracking-wide", dark ? "text-slate-400 bg-slate-800/50" : "text-slate-500 bg-slate-50")}>
                <tr><Th>Produk</Th><Th>SKU</Th><Th className="text-right">Harga Jual</Th><Th className="text-right">Modal</Th><Th className="text-right">Stok</Th><Th>Status</Th><Th className="text-right">Aksi</Th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={cx("border-t", dark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50")}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className={dark ? "text-slate-400" : "text-slate-500"}>{p.sku}</Td>
                    <Td className="text-right tabular">{fmtIDR(p.price)}</Td>
                    <Td className="text-right tabular">{fmtIDR(p.cost)}</Td>
                    <Td className="text-right">
                      <button onClick={() => setStockModal(p)} className={cx("tabular font-semibold px-2 py-0.5 rounded-lg", p.stock <= p.minStock ? "bg-amber-500/15 text-amber-500" : dark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700")}>{p.stock}</button>
                    </Td>
                    <Td><Badge tone={p.status === "active" ? "green" : "neutral"}>{p.status === "active" ? "Aktif" : "Nonaktif"}</Badge></Td>
                    <Td className="text-right"><RowActions onView={() => openEdit(p)} onDelete={() => removeProduct(p.id)} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "new" ? "Tambah Produk" : "Edit Produk"}>
        {modal && <ProductForm data={modal.data} onSave={saveProduct} />}
      </Modal>

      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title={`Sesuaikan Stok — ${stockModal?.name}`}>
        {stockModal && <StockAdjustForm product={stockModal} onSave={adjustStock} />}
      </Modal>
    </div>
  );
}
function ProductForm({ data, onSave }) {
  const [form, setForm] = useState(data);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-3">
      <Field label="Nama produk" required><Input value={form.name} onChange={set("name")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU / Kode"><Input value={form.sku} onChange={set("sku")} /></Field>
        <Field label="Kategori"><Input value={form.category} onChange={set("category")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Harga jual (Rp)" required><Input type="number" value={form.price} onChange={set("price")} /></Field>
        <Field label="Harga modal (Rp)"><Input type="number" value={form.cost} onChange={set("cost")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stok"><Input type="number" value={form.stock} onChange={set("stock")} /></Field>
        <Field label="Stok minimum"><Input type="number" value={form.minStock} onChange={set("minStock")} /></Field>
      </div>
      <Field label="Status">
        <Select value={form.status} onChange={set("status")}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></Select>
      </Field>
      <Btn variant="primary" className="w-full" onClick={() => onSave(form)}>Simpan Produk</Btn>
    </div>
  );
}
function StockAdjustForm({ product, onSave }) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-xs text-center">Stok saat ini: <span className="font-bold">{product.stock}</span></p>
      <Field label="Jumlah"><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} /></Field>
      <Field label="Alasan / catatan"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth. Restock mingguan" /></Field>
      <div className="flex gap-2">
        <Btn variant="green" className="flex-1" onClick={() => onSave(product.id, qty, reason)}>+ Stok Masuk</Btn>
        <Btn variant="red" className="flex-1" onClick={() => onSave(product.id, -qty, reason)}>− Stok Keluar</Btn>
      </div>
    </div>
  );
}

/* ============================================================
   STORES PAGE
   ============================================================ */
function StoresPage() {
  const { dark, db, setDb, notify } = useApp();
  const [modal, setModal] = useState(null);

  const openNew = () => setModal({ mode: "new", data: { name: "", address: "", whatsapp: "", owner: "", pic: "", initialBalance: 0, initialCapital: 0, status: "active", logoColor: CHART_COLORS[db.stores.length % CHART_COLORS.length] } });
  const openEdit = (s) => setModal({ mode: "edit", data: { ...s } });

  const save = (data) => {
    if (!data.name.trim()) { notify("Nama toko wajib diisi", "red"); return; }
    if (modal.mode === "new") {
      setDb((d) => ({ ...d, stores: [...d.stores, { ...data, id: uid("st"), initialBalance: Number(data.initialBalance), initialCapital: Number(data.initialCapital) }] }));
      notify("Toko baru ditambahkan");
    } else {
      setDb((d) => ({ ...d, stores: d.stores.map((s) => s.id === data.id ? { ...data, initialBalance: Number(data.initialBalance), initialCapital: Number(data.initialCapital) } : s) }));
      notify("Toko diperbarui");
    }
    setModal(null);
  };
  const toggleStatus = (s) => setDb((d) => ({ ...d, stores: d.stores.map((x) => x.id === s.id ? { ...x, status: x.status === "active" ? "nonactive" : "active" } : x) }));
  const removeStore = (id) => { if (confirm("Hapus toko ini? Semua data terkait akan tersembunyi.")) { setDb((d) => ({ ...d, stores: d.stores.filter((s) => s.id !== id) })); notify("Toko dihapus", "red"); } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={cx("text-xs", dark ? "text-slate-400" : "text-slate-500")}>{db.stores.length} toko terdaftar</p>
        <Btn variant="primary" size="sm" onClick={openNew}><Plus size={14} /> Tambah Toko</Btn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.stores.map((s) => (
          <Card key={s.id} className="p-4 sm:p-5 animate-fadeUp">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold" style={{ background: s.logoColor }}>
                {s.name.replace("Toko ", "").charAt(0)}
              </div>
              <Badge tone={s.status === "active" ? "green" : "neutral"}>{s.status === "active" ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <p className="font-display font-bold text-sm truncate">{s.name}</p>
            <p className={cx("text-xs mt-0.5 flex items-center gap-1 truncate", dark ? "text-slate-400" : "text-slate-500")}><MapPin size={11} className="shrink-0" /> {s.address}</p>
            <p className={cx("text-xs mt-1 flex items-center gap-1", dark ? "text-slate-400" : "text-slate-500")}><Phone size={11} className="shrink-0" /> +{s.whatsapp}</p>
            <div className={cx("grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs", dark ? "border-slate-700" : "border-slate-100")}>
              <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Pemilik</p><p className="font-semibold">{s.owner}</p></div>
              <div><p className={dark ? "text-slate-500" : "text-slate-400"}>PJ</p><p className="font-semibold">{s.pic}</p></div>
              <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Modal</p><p className="font-semibold">{fmtIDRshort(s.initialCapital)}</p></div>
              <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Saldo awal</p><p className="font-semibold">{fmtIDRshort(s.initialBalance)}</p></div>
            </div>
            <div className="flex gap-2 mt-3.5">
              <Btn variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(s)}><Edit2 size={12} /> Edit</Btn>
              <Btn variant="subtle" size="sm" className="flex-1" onClick={() => toggleStatus(s)}>{s.status === "active" ? "Nonaktifkan" : "Aktifkan"}</Btn>
              <button onClick={() => removeStore(s.id)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "new" ? "Tambah Toko Baru" : "Edit Toko"} wide>
        {modal && <StoreForm data={modal.data} onSave={save} />}
      </Modal>
    </div>
  );
}
function StoreForm({ data, onSave }) {
  const [form, setForm] = useState(data);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nama toko" required><Input value={form.name} onChange={set("name")} /></Field>
        <Field label="No. WhatsApp" required hint="Format: 62xxxxxxxxxx"><Input value={form.whatsapp} onChange={set("whatsapp")} placeholder="6281234567890" /></Field>
      </div>
      <Field label="Alamat"><Textarea rows={2} value={form.address} onChange={set("address")} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nama pemilik"><Input value={form.owner} onChange={set("owner")} /></Field>
        <Field label="Penanggung jawab"><Input value={form.pic} onChange={set("pic")} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Saldo awal (Rp)"><Input type="number" value={form.initialBalance} onChange={set("initialBalance")} /></Field>
        <Field label="Modal awal (Rp)"><Input type="number" value={form.initialCapital} onChange={set("initialCapital")} /></Field>
      </div>
      <Field label="Status">
        <Select value={form.status} onChange={set("status")}><option value="active">Aktif</option><option value="nonactive">Nonaktif</option></Select>
      </Field>
      <Btn variant="primary" className="w-full" onClick={() => onSave(form)}>Simpan Toko</Btn>
    </div>
  );
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
function SettingsPage() {
  const { dark, user, db } = useApp();
  return (
    <div className="max-w-xl space-y-4">
      <Card className="p-4 sm:p-5">
        <p className="font-display font-bold text-sm mb-3">Akun</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-display font-bold">{user.name.charAt(0)}</div>
          <div><p className="text-sm font-semibold">{user.name}</p><Badge tone="indigo">{ROLES.find((r) => r.id === user.role)?.label}</Badge></div>
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <p className="font-display font-bold text-sm mb-3">WhatsApp Report</p>
        <p className={cx("text-xs mb-3", dark ? "text-slate-400" : "text-slate-500")}>Nomor tujuan laporan diambil dari data masing-masing toko (menu Kelola Toko). Saat ini menggunakan WhatsApp Click-to-Chat — siap dikembangkan ke WhatsApp Business API.</p>
        <div className="space-y-2">
          {db.stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="font-medium">{s.name}</span>
              <span className={dark ? "text-slate-400" : "text-slate-500"}>+{s.whatsapp}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <p className="font-display font-bold text-sm mb-2">Tentang Data</p>
        <p className={cx("text-xs leading-relaxed", dark ? "text-slate-400" : "text-slate-500")}>
          Data tersimpan otomatis dan aman di penyimpanan pribadi akun Anda. Setiap transaksi selalu menyertakan store_id sehingga keuangan antar toko tidak tercampur.
        </p>
      </Card>
    </div>
  );
}
