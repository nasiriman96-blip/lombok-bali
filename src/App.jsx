import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Building2, Plus, Bell, User, TrendingUp, TrendingDown,
  Wallet, Calendar, MapPin, Trash2, AlertTriangle, CheckCircle2,
  X, PiggyBank, HandCoins, BarChart3, Receipt, Search,
  Sun, Moon, Cloud, LogOut, ShieldCheck, UserCog, Lock,
  Droplet, Zap, ShoppingBag, Tag, Calculator, Delete, Cake,
  Baby, Pencil, ArrowUpRight, ArrowDownRight, ChevronRight,
  Sparkles, Clock, PlusCircle, Users, PartyPopper, Target,
  FileText, Filter, MoreVertical, CircleDollarSign
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Area, AreaChart
} from "recharts";
import { loadAppData, saveAppData, subscribeAppData, getSession, setSession, clearSession } from "./lib/storage";

// ===== FONTS =====
const FONT_LINK_ID = "lb-fonts-v2";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans@5.0.3/index.css";
    document.head.appendChild(link);
    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@5.0.3/index.css";
    document.head.appendChild(link2);
    const link3 = document.createElement("link");
    link3.rel = "stylesheet";
    link3.href = "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.3/index.css";
    document.head.appendChild(link3);
  }, []);
}

// ===== PALETTE - Modern, cerah, friendly =====
const PALETTE = {
  dark: {
    bg: "#0B0D17", bgSoft: "#111425", surface: "#181B2E", surface2: "#22263D",
    border: "#2A2F4A", borderSoft: "#1F233A", text: "#F5F6FA", textMuted: "#9BA3BE",
    textFaint: "#6B7394", primary: "#8B5CF6", primarySoft: "rgba(139,92,246,0.15)",
    secondary: "#EC4899", secondarySoft: "rgba(236,72,153,0.15)",
    jade: "#10B981", jadeSoft: "rgba(16,185,129,0.15)",
    gold: "#F59E0B", goldSoft: "rgba(245,158,11,0.15)",
    coral: "#EF4444", coralSoft: "rgba(239,68,68,0.15)",
    blue: "#3B82F6", blueSoft: "rgba(59,130,246,0.15)",
    gradient1: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    gradient2: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    gradient3: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
  },
  light: {
    bg: "#F8F9FC", bgSoft: "#FFFFFF", surface: "#FFFFFF", surface2: "#F3F4F9",
    border: "#E5E7EB", borderSoft: "#F1F2F7", text: "#111827", textMuted: "#6B7280",
    textFaint: "#9CA3AF", primary: "#7C3AED", primarySoft: "rgba(124,58,237,0.10)",
    secondary: "#DB2777", secondarySoft: "rgba(219,39,119,0.10)",
    jade: "#059669", jadeSoft: "rgba(5,150,105,0.10)",
    gold: "#D97706", goldSoft: "rgba(217,119,6,0.10)",
    coral: "#DC2626", coralSoft: "rgba(220,38,38,0.10)",
    blue: "#2563EB", blueSoft: "rgba(37,99,235,0.10)",
    gradient1: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    gradient2: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    gradient3: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
  },
};

const PROJECT_COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

const DEFAULT_CATEGORIES = [
  { id: "pdam", label: "💧 Air PDAM", icon: Droplet, color: "#3B82F6", default: true, emoji: "💧" },
  { id: "listrik", label: "⚡ Listrik", icon: Zap, color: "#F59E0B", default: true, emoji: "⚡" },
  { id: "belanja", label: "🛍️ Belanja", icon: ShoppingBag, color: "#10B981", default: true, emoji: "🛍️" },
  { id: "sewa-rumah", label: "🏠 Sewa Rumah", icon: Home, color: "#EC4899", default: true, emoji: "🏠" },
  { id: "tabungan", label: "🐷 Tabungan", icon: PiggyBank, color: "#8B5CF6", default: true, emoji: "🐷" },
  { id: "makan", label: "🍽️ Makan", icon: ShoppingBag, color: "#F97316", default: true, emoji: "🍽️" },
  { id: "transport", label: "🚗 Transport", icon: CircleDollarSign, color: "#06B6D4", default: true, emoji: "🚗" },
  { id: "lainnya", label: "📦 Lainnya", icon: Tag, color: "#6B7280", default: true, emoji: "📦" },
];

const isValidIcon = (icon) =>
  typeof icon === "function" || (icon && typeof icon === "object" && !!icon.$$typeof);

const hydrateCategories = (loaded) => {
  if (!Array.isArray(loaded) || loaded.length === 0) return DEFAULT_CATEGORIES;
  return loaded.map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.id === c.id);
    if (def) return { ...c, icon: def.icon, emoji: def.emoji };
    return { ...c, icon: isValidIcon(c.icon) ? c.icon : Tag, emoji: c.emoji || "📦" };
  });
};

const fmtIDR = (n) => {
  const num = n || 0;
  if (Math.abs(num) >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
};

const fmtIDRFull = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (s) => {
  if (!s) return "-";
  return new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const fmtDateShort = (s) => {
  if (!s) return "-";
  return new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const daysUntilBirthday = (birthDateStr) => {
  if (!birthDateStr) return null;
  const today = new Date(new Date().toDateString());
  const birth = new Date(birthDateStr + "T00:00:00");
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const days = Math.round((next - today) / 86400000);
  const nextAge = next.getFullYear() - birth.getFullYear();
  return { days, nextAge };
};

const monthKey = (s) => s.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short" });
};

const uid = (p) => p + Math.random().toString(36).slice(2, 9);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 11) return { text: "Selamat Pagi", emoji: "🌅" };
  if (h < 15) return { text: "Selamat Siang", emoji: "☀️" };
  if (h < 18) return { text: "Selamat Sore", emoji: "🌇" };
  return { text: "Selamat Malam", emoji: "🌙" };
};

// ===== SHARED STYLES =====
const inputStyle = (C) => ({
  background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
  width: "100%", padding: "12px 14px", borderRadius: "12px", fontSize: "14px",
  outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif",
});

// ===== COMPONENTS =====
function Modal({ open, onClose, title, children, C, icon }) {
  if (!open) return null;
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.primarySoft }}>
                  {icon}
                </div>
              )}
              <h3 style={{ color: C.text, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700 }}>{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ background: C.surface2, color: C.textMuted }}>
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function Field({ label, children, C, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: C.textMuted, textTransform: "uppercase" }}>{label}</span>
      {children}
      {hint && <span className="block text-xs mt-1.5" style={{ color: C.textFaint }}>{hint}</span>}
    </label>
  );
}

function PrimaryButton({ children, onClick, C, disabled, variant = "primary" }) {
  const styles = {
    primary: { background: C.gradient1, color: "#fff", boxShadow: `0 8px 20px ${C.primarySoft}` },
    success: { background: C.gradient3, color: "#fff", boxShadow: `0 8px 20px ${C.jadeSoft}` },
    ghost: { background: C.surface2, color: C.text, border: `1px solid ${C.border}` },
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
      onClick={onClick} disabled={disabled}
      className="w-full py-3.5 rounded-2xl font-semibold transition-all duration-200"
      style={{ ...styles[variant], opacity: disabled ? 0.5 : 1, fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: 15 }}
    >
      {children}
    </motion.button>
  );
}

function Badge({ children, tone = "neutral", C, small }) {
  const map = {
    neutral: { bg: C.surface2, fg: C.textMuted },
    primary: { bg: C.primarySoft, fg: C.primary },
    jade: { bg: C.jadeSoft, fg: C.jade },
    gold: { bg: C.goldSoft, fg: C.gold },
    coral: { bg: C.coralSoft, fg: C.coral },
    blue: { bg: C.blueSoft, fg: C.blue },
    pink: { bg: C.secondarySoft, fg: C.secondary },
  };
  const s = map[tone] || map.neutral;
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{
      background: s.bg, color: s.fg,
      padding: small ? "3px 8px" : "5px 11px",
      fontSize: small ? 10 : 12,
    }}>
      {children}
    </span>
  );
}

function ProgressBar({ pct, color, C, height = 8 }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: C.surface2, height }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full" style={{ background: color }}
      />
    </div>
  );
}

function AmountInput({ value, onChange, C, placeholder = "0" }) {
  const [showCalc, setShowCalc] = useState(false);
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  const formatted = digits ? Number(digits).toLocaleString("id-ID") : "";
  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <span style={{ color: C.textMuted, fontSize: 14, fontWeight: 600 }}>Rp</span>
        <input
          type="text" inputMode="numeric" value={formatted}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={placeholder}
          style={{ background: "transparent", border: "none", color: C.text, flex: 1, outline: "none", fontSize: 16, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}
          type="button" onClick={() => setShowCalc(true)}
          className="p-2 rounded-xl" style={{ color: C.primary, background: C.primarySoft }}
          title="Kalkulator"
        >
          <Calculator size={16} />
        </motion.button>
      </div>
      {showCalc && (
        <CalculatorPopover C={C} initial={digits || "0"}
          onApply={(r) => { onChange(String(r)); setShowCalc(false); }}
          onClose={() => setShowCalc(false)}
        />
      )}
    </div>
  );
}

function CalculatorPopover({ C, initial, onApply, onClose }) {
  const [display, setDisplay] = useState(initial && initial !== "0" ? initial : "0");
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [resetNext, setResetNext] = useState(false);
  const compute = (a, b, o) => {
    if (o === "+") return a + b; if (o === "-") return a - b;
    if (o === "×") return a * b; if (o === "÷") return b === 0 ? a : a / b;
    return b;
  };
  const pressDigit = (d) => {
    if (resetNext) { setDisplay(d); setResetNext(false); return; }
    setDisplay((p) => (p === "0" ? d : p.length < 15 ? p + d : p));
  };
  const pressOp = (no) => {
    const c = Number(display);
    if (acc !== null && op && !resetNext) { const r = compute(acc, c, op); setAcc(r); setDisplay(String(r)); }
    else setAcc(c);
    setOp(no); setResetNext(true);
  };
  const pressEquals = () => {
    if (acc === null || !op) return;
    const r = compute(acc, Number(display), op);
    setDisplay(String(r)); setAcc(null); setOp(null); setResetNext(true);
  };
  const pressClear = () => { setDisplay("0"); setAcc(null); setOp(null); setResetNext(false); };
  const pressBack = () => setDisplay((p) => (p.length > 1 ? p.slice(0, -1) : "0"));
  const apply = () => {
    const f = acc !== null && op ? compute(acc, Number(display), op) : Number(display);
    onApply(Math.max(0, Math.round(f)));
  };
  const formatted = display ? Number(display).toLocaleString("id-ID") : "0";
  const B = "py-3.5 rounded-2xl font-semibold text-lg transition-all active:scale-95";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
            <Calculator size={16} color={C.primary} /> Kalkulator
          </span>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={18} /></button>
        </div>
        <div className="rounded-2xl px-4 py-4 mb-3 text-right" style={{ background: C.surface2 }}>
          {op && <div className="text-xs mb-1" style={{ color: C.textMuted }}>{Number(acc).toLocaleString("id-ID")} {op}</div>}
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: C.text }}>Rp {formatted}</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button onClick={pressClear} className={B} style={{ background: C.coralSoft, color: C.coral }}>C</button>
          <button onClick={pressBack} className={B} style={{ background: C.surface2, color: C.textMuted }}><Delete size={18} className="mx-auto" /></button>
          <button onClick={() => pressOp("÷")} className={B} style={{ background: op === "÷" ? C.primary : C.surface2, color: op === "÷" ? "#fff" : C.primary }}>÷</button>
          <button onClick={() => pressOp("×")} className={B} style={{ background: op === "×" ? C.primary : C.surface2, color: op === "×" ? "#fff" : C.primary }}>×</button>
          {["7", "8", "9"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={B} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={() => pressOp("-")} className={B} style={{ background: op === "-" ? C.primary : C.surface2, color: op === "-" ? "#fff" : C.primary }}>-</button>
          {["4", "5", "6"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={B} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={() => pressOp("+")} className={B} style={{ background: op === "+" ? C.primary : C.surface2, color: op === "+" ? "#fff" : C.primary }}>+</button>
          {["1", "2", "3"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={B} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={pressEquals} className="row-span-2 rounded-2xl font-bold text-lg" style={{ background: C.gradient1, color: "#fff" }}>=</button>
          <button onClick={() => pressDigit("0")} className={`${B} col-span-2`} style={{ background: C.surface2, color: C.text }}>0</button>
          <button onClick={() => pressDigit("000")} className={B} style={{ background: C.surface2, color: C.text }}>000</button>
        </div>
        <PrimaryButton C={C} onClick={apply}>✨ Gunakan Nominal Ini</PrimaryButton>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function EmptyState({ emoji, title, description, action, C }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6"
    >
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: C.text, fontFamily: "Space Grotesk" }}>{title}</h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: C.textMuted, lineHeight: 1.6 }}>{description}</p>
      {action && (
        <motion.button
          whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.03 }}
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
          style={{ background: C.gradient1, color: "#fff" }}
        >
          <Plus size={16} /> {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// ===== ACCOUNTS =====
const ACCOUNTS = [
  { username: "admin", password: "admin313", role: "admin", displayName: "Admin" },
  { username: "Risyad", password: "313500", role: "staff", displayName: "Risyad" },
  { username: "Damah", password: "313500", role: "staff", displayName: "Damah" },
  { username: "Nasir", password: "313500", role: "staff", displayName: "Nasir" },
];

// ===== LOGIN =====
function LoginScreen({ C, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      const acc = ACCOUNTS.find(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
      );
      if (!acc) { setError("Username atau password salah 🙏"); setLoading(false); return; }
      setError(""); onLogin({ name: acc.displayName, role: acc.role });
    }, 500);
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "Plus Jakarta Sans, sans-serif" }}
      className="flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 -left-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: C.primary }} />
        <div className="absolute bottom-10 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: C.secondary }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl p-8 relative z-10"
        style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: C.gradient1 }}
          >
            <Wallet size={36} color="#fff" />
          </motion.div>
          <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 800, color: C.text }}>
            Lombok Bali
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>💰 Keuangan Kawasan</p>
        </div>

        <div className="mb-6 p-4 rounded-2xl" style={{ background: C.primarySoft }}>
          <div className="flex items-start gap-3">
            <Sparkles size={18} color={C.primary} className="shrink-0 mt-0.5" />
            <div className="text-xs" style={{ color: C.text, lineHeight: 1.6 }}>
              <strong>Halo!</strong> Masuk untuk mengelola keuangan kawasan kamu dengan mudah dan menyenangkan.
            </div>
          </div>
        </div>

        <Field label="Username" C={C}>
          <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="Masukkan username" style={inputStyle(C)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="Password" C={C}>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••" style={inputStyle(C)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: C.coralSoft, color: C.coral }}
            >
              <AlertTriangle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <PrimaryButton C={C} onClick={submit} disabled={!username.trim() || !password || loading}>
          {loading ? "Memproses..." : "Masuk Sekarang →"}
        </PrimaryButton>

        <div className="mt-6 text-center text-xs" style={{ color: C.textFaint }}>
          Lupa password? Hubungi admin 👨‍💼
        </div>
      </motion.div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  useFonts();
  const [isDark, setIsDark] = useState(true);
  const C = isDark ? PALETTE.dark : PALETTE.light;
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => { setUser(getSession()); setUserLoaded(true); }, []);
  const handleLogin = (u) => { setUser(u); setSession(u); };
  const handleLogout = () => { setUser(null); clearSession(); };

  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [bills, setBills] = useState([]);
  const [debts, setDebts] = useState([]);
  const [people, setPeople] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeProject, setActiveProject] = useState("all");
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState("idle");
  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);

  const [txModal, setTxModal] = useState(null);
  const [goalModal, setGoalModal] = useState(null);
  const [billModal, setBillModal] = useState(null);
  const [debtModal, setDebtModal] = useState(null);
  const [personModal, setPersonModal] = useState(null);
  const [projModal, setProjModal] = useState(null);
  const [catModal, setCatModal] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadAppData();
      if (data) {
        skipNextSave.current = true;
        if (data.projects) setProjects(data.projects);
        if (data.transactions) setTransactions(data.transactions);
        if (data.goals) setGoals(data.goals);
        if (data.bills) setBills(data.bills);
        if (data.debts) setDebts(data.debts);
        if (data.people) setPeople(data.people);
        if (data.categories) setCategories(hydrateCategories(data.categories));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const unsub = subscribeAppData((data) => {
      if (!data) return;
      skipNextSave.current = true;
      if (data.projects) setProjects(data.projects);
      if (data.transactions) setTransactions(data.transactions);
      if (data.goals) setGoals(data.goals);
      if (data.bills) setBills(data.bills);
      if (data.debts) setDebts(data.debts);
      if (data.people) setPeople(data.people);
      if (data.categories) setCategories(hydrateCategories(data.categories));
      setSyncState("saved");
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSyncState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveAppData({ projects, transactions, goals, bills, debts, people, categories });
      setSyncState("saved");
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [projects, transactions, goals, bills, debts, people, categories, loaded]);

  const FALLBACK_CATEGORY = { id: "unknown", label: "📦 Lainnya", icon: Tag, color: "#6B7280", emoji: "📦" };
  const getCat = (id) => categories.find((c) => c.id === id) || categories[categories.length - 1] || FALLBACK_CATEGORY;

  const scopedTx = useMemo(
    () => (activeProject === "all" ? transactions : transactions.filter((t) => t.projectId === activeProject)),
    [transactions, activeProject]
  );

  const totals = useMemo(() => {
    const income = scopedTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = scopedTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [scopedTx]);

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = useMemo(
    () => scopedTx.filter((t) => t.type === "expense" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0),
    [scopedTx, thisMonthKey]
  );
  const monthIncome = useMemo(
    () => scopedTx.filter((t) => t.type === "income" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0),
    [scopedTx, thisMonthKey]
  );
  const monthBudget = useMemo(
    () => (activeProject === "all" ? projects.reduce((s, p) => s + p.budget, 0) : projects.find((p) => p.id === activeProject)?.budget || 0),
    [projects, activeProject]
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    scopedTx.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return categories.map((c) => ({ ...c, value: map[c.id] || 0 })).filter((c) => c.value > 0);
  }, [scopedTx, categories]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.filter((t) => activeProject === "all" || t.projectId === activeProject).forEach((t) => {
      const k = monthKey(t.date);
      if (!map[k]) map[k] = { month: k, Pemasukan: 0, Pengeluaran: 0 };
      if (t.type === "income") map[k].Pemasukan += t.amount; else map[k].Pengeluaran += t.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map((r) => ({ ...r, label: monthLabel(r.month) }));
  }, [transactions, activeProject]);

  const upcomingBills = useMemo(() => bills.filter((b) => activeProject === "all" || b.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [bills, activeProject]);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "Semua Kawasan";
  const projectColor = (id) => projects.find((p) => p.id === id)?.color || C.primary;
  const isAdmin = user?.role === "admin";

  if (!userLoaded) return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!user) return <LoginScreen C={C} onLogin={handleLogin} />;

  const NAV = [
    { id: "home", label: "Beranda", icon: Home, emoji: "🏠" },
    { id: "projects", label: "Usaha", icon: Building2, emoji: "🏢" },
    { id: "tx", label: "Riwayat", icon: Receipt, emoji: "📋" },
    { id: "bills", label: "Tagihan", icon: Bell, emoji: "🔔" },
    { id: "profile", label: "Profil", icon: User, emoji: "👤" },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "Plus Jakarta Sans, sans-serif", minHeight: "100vh" }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* TOP HEADER */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 py-4" style={{ background: `${C.bg}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: C.gradient1 }}>
              <Wallet size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk", fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1 }}>Lombok Bali</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: syncState === "saving" ? C.gold : C.jade }} />
                <span style={{ fontSize: 10, color: C.textFaint }}>
                  {syncState === "saving" ? "Menyimpan..." : "Tersimpan"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Project Switcher (Desktop) */}
            {projects.length > 0 && (
              <select
                value={activeProject}
                onChange={(e) => setActiveProject(e.target.value)}
                className="hidden sm:block px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, outline: "none" }}
              >
                <option value="all">✨ Semua Kawasan</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
              onClick={() => setIsDark((d) => !d)}
              className="p-2.5 rounded-xl" style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile project switcher */}
        {projects.length > 0 && (
          <div className="sm:hidden mt-3 flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveProject("all")}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: activeProject === "all" ? C.gradient1 : C.surface2, color: activeProject === "all" ? "#fff" : C.textMuted }}
            >
              ✨ Semua
            </motion.button>
            {projects.map((p) => (
              <motion.button
                key={p.id} whileTap={{ scale: 0.95 }}
                onClick={() => setActiveProject(p.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                style={{ background: activeProject === p.id ? C.surface2 : "transparent", color: activeProject === p.id ? C.text : C.textMuted, border: `1px solid ${activeProject === p.id ? C.border : C.borderSoft}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-28">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <HomeView key="home" C={C} projects={projects} totals={totals} monthSpend={monthSpend}
              monthIncome={monthIncome} monthBudget={monthBudget} categoryBreakdown={categoryBreakdown}
              monthlyTrend={monthlyTrend} upcomingBills={upcomingBills} scopedTx={scopedTx}
              activeProject={activeProject} projectName={projectName} setTab={setTab}
              setTxModal={setTxModal} people={people} getCat={getCat} user={user}
              setProjModal={setProjModal} isAdmin={isAdmin} setGoalModal={setGoalModal}
              setBillModal={setBillModal} />
          )}
          {tab === "projects" && (
            <ProjectsView key="projects" C={C} projects={projects} transactions={transactions}
              setActiveProject={setActiveProject} setTab={setTab} setProjModal={setProjModal}
              isAdmin={isAdmin} />
          )}
          {tab === "tx" && (
            <TransactionsView key="tx" C={C} transactions={transactions} projects={projects}
              activeProject={activeProject} projectName={projectName} projectColor={projectColor}
              setTxModal={setTxModal} setTransactions={setTransactions} isAdmin={isAdmin}
              categories={categories} getCat={getCat} />
          )}
          {tab === "bills" && (
            <BillsTab key="bills" C={C} bills={bills} setBills={setBills} goals={goals} setGoals={setGoals}
              debts={debts} setDebts={setDebts} projects={projects} projectName={projectName}
              setBillModal={setBillModal} setGoalModal={setGoalModal} setDebtModal={setDebtModal}
              isAdmin={isAdmin} getCat={getCat} activeProject={activeProject}
              setTransactions={setTransactions} />
          )}
          {tab === "profile" && (
            <ProfileView key="profile" C={C} user={user} onLogout={handleLogout}
              people={people} setPeople={setPeople} projects={projects} projectName={projectName}
              setPersonModal={setPersonModal} isAdmin={isAdmin} activeProject={activeProject}
              categories={categories} setCategories={setCategories} setCatModal={setCatModal}
              isDark={isDark} setIsDark={setIsDark} totals={totals} transactions={transactions} />
          )}
        </AnimatePresence>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <motion.button
        whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
        onClick={() => setTxModal("new")}
        className="fixed z-40 flex items-center gap-2 shadow-2xl"
        style={{
          background: C.gradient1, color: "#fff", fontWeight: 700,
          padding: "14px 22px", borderRadius: 999, fontSize: 14,
          bottom: 90, right: 20,
          boxShadow: `0 10px 30px ${C.primarySoft}`,
        }}
      >
        <Plus size={20} strokeWidth={3} />
        <span className="hidden sm:inline">Catat Uang</span>
      </motion.button>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2"
        style={{ background: `${C.bg}ee`, backdropFilter: "blur(16px)", borderTop: `1px solid ${C.borderSoft}` }}>
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <motion.button
                key={n.id} whileTap={{ scale: 0.9 }}
                onClick={() => setTab(n.id)}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all"
                style={{ background: active ? C.primarySoft : "transparent" }}
              >
                <Icon size={20} style={{ color: active ? C.primary : C.textFaint }} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.primary : C.textFaint }}>
                  {n.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      <AddTransactionModal open={!!txModal} editing={txModal && txModal !== "new" ? txModal : null}
        onClose={() => setTxModal(null)} C={C} projects={projects} goals={goals} debts={debts}
        categories={categories}
        onAddTransaction={(t) => setTransactions((p) => [{ id: uid("t"), ...t }, ...p])}
        onEditTransaction={(id, data) => setTransactions((p) => p.map((t) => (t.id === id ? { ...t, ...data } : t)))}
        onContributeGoal={(gid, amt) => setGoals((p) => p.map((g) => (g.id === gid ? { ...g, current: g.current + amt } : g)))}
        onPayDebt={(did, amt) => setDebts((p) => p.map((d) => (d.id === did ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)))}
      />
      <AddGoalModal open={!!goalModal} editing={goalModal && goalModal !== "new" ? goalModal : null}
        onClose={() => setGoalModal(null)} C={C} projects={projects}
        onSave={(data) => { if (data.id) setGoals((p) => p.map((g) => (g.id === data.id ? { ...g, ...data } : g))); else setGoals((p) => [{ id: uid("g"), current: 0, ...data }, ...p]); }} />
      <AddBillModal open={!!billModal} editing={billModal && billModal !== "new" ? billModal : null}
        onClose={() => setBillModal(null)} C={C} projects={projects} categories={categories}
        onSave={(data) => { if (data.id) setBills((p) => p.map((b) => (b.id === data.id ? { ...b, ...data } : b))); else setBills((p) => [{ id: uid("b"), paidAmount: 0, ...data }, ...p]); }} />
      <AddDebtModal open={!!debtModal} editing={debtModal && debtModal !== "new" ? debtModal : null}
        onClose={() => setDebtModal(null)} C={C} projects={projects}
        onSave={(data) => { if (data.id) setDebts((p) => p.map((d) => (d.id === data.id ? { ...d, ...data } : d))); else setDebts((p) => [{ id: uid("d"), paidAmount: 0, ...data }, ...p]); }} />
      <AddPersonModal open={!!personModal} editing={personModal && personModal !== "new" ? personModal : null}
        onClose={() => setPersonModal(null)} C={C} projects={projects}
        onSave={(data) => { if (data.id) setPeople((p) => p.map((x) => (x.id === data.id ? { ...x, ...data } : x))); else setPeople((p) => [{ id: uid("ah"), ...data }, ...p]); }} />
      <AddProjectModal open={!!projModal} editing={projModal && projModal !== "new" ? projModal : null}
        onClose={() => setProjModal(null)} C={C}
        onSave={(data) => { if (data.id) setProjects((p) => p.map((x) => (x.id === data.id ? { ...x, ...data } : x))); else setProjects((p) => [...p, { id: uid("p"), color: PROJECT_COLORS[p.length % PROJECT_COLORS.length], ...data }]); }} />
      <ManageCategoriesModal open={catModal} onClose={() => setCatModal(false)} C={C}
        categories={categories} setCategories={setCategories} />
    </div>
  );
}

// ===== HOME VIEW =====
function HomeView({ C, projects, totals, monthSpend, monthIncome, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, setTab, setTxModal, people, getCat, user, setProjModal, isAdmin, setGoalModal, setBillModal }) {
  const greeting = getGreeting();
  const recent = scopedTx.slice(0, 5);
  const dueSoon = upcomingBills.filter((b) => b.paidAmount < b.amount).slice(0, 3);
  const budgetPct = monthBudget ? (monthSpend / monthBudget) * 100 : 0;

  const birthdays = (people || [])
    .map((p) => ({ person: p, bday: daysUntilBirthday(p.birthDate) }))
    .filter((x) => x.bday && x.bday.days <= 14)
    .sort((a, b) => a.bday.days - b.bday.days);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-5 py-4"
    >
      {/* GREETING CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{ background: C.gradient1 }}
      >
        <div className="absolute top-0 right-0 text-[140px] opacity-10 leading-none select-none pointer-events-none">
          {greeting.emoji}
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{greeting.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{greeting.text},</span>
          </div>
          <h1 style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
            {user?.name}! 👋
          </h1>
          <p className="text-sm mt-2 mb-5" style={{ color: "rgba(255,255,255,0.85)", maxWidth: 300 }}>
            Yuk pantau keuangan kawasan kamu hari ini
          </p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>💰 Saldo saat ini</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            {fmtIDR(totals.balance)}
          </div>
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            {activeProject === "all" ? "✨ Seluruh kawasan" : `📍 ${projectName(activeProject)}`}
          </div>
        </div>
      </motion.div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl p-4" style={{ background: C.jadeSoft, border: `1px solid ${C.jade}22` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.jade }}>
              <ArrowUpRight size={16} color="#fff" />
            </div>
            <span className="text-xs font-semibold" style={{ color: C.jade }}>Masuk bulan ini</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>
            {fmtIDR(monthIncome)}
          </div>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl p-4" style={{ background: C.coralSoft, border: `1px solid ${C.coral}22` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.coral }}>
              <ArrowDownRight size={16} color="#fff" />
            </div>
            <span className="text-xs font-semibold" style={{ color: C.coral }}>Keluar bulan ini</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>
            {fmtIDR(monthSpend)}
          </div>
        </motion.div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
          ⚡ Aksi Cepat
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Catat", emoji: "✏️", action: () => setTxModal("new"), bg: C.gradient1 },
            { label: "Usaha", emoji: "🏢", action: () => setProjModal("new"), bg: C.gradient2, needAdmin: true },
            { label: "Target", emoji: "🎯", action: () => setGoalModal("new"), bg: C.gradient3, needAdmin: true },
            { label: "Tagihan", emoji: "🔔", action: () => setBillModal("new"), bg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)", needAdmin: true },
          ].filter((a) => !a.needAdmin || isAdmin).map((a, i) => (
            <motion.button
              key={i} whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }}
              onClick={a.action}
              className="aspect-square rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-md"
              style={{ background: a.bg }}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-bold" style={{ color: "#fff" }}>{a.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* BUDGET PROGRESS */}
      {monthBudget > 0 && (
        <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
              📊 Anggaran Bulan Ini
            </h3>
            <Badge C={C} tone={budgetPct > 90 ? "coral" : budgetPct > 70 ? "gold" : "jade"}>
              {budgetPct.toFixed(0)}%
            </Badge>
          </div>
          <ProgressBar pct={budgetPct} color={budgetPct > 90 ? C.coral : budgetPct > 70 ? C.gold : C.jade} C={C} height={10} />
          <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textMuted }}>
            <span>Terpakai <strong style={{ color: C.text }}>{fmtIDR(monthSpend)}</strong></span>
            <span>dari <strong style={{ color: C.text }}>{fmtIDR(monthBudget)}</strong></span>
          </div>
        </div>
      )}

      {/* BIRTHDAY ALERT */}
      {birthdays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.goldSoft}, ${C.secondarySoft})`, border: `1px solid ${C.gold}33` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper size={18} color={C.gold} />
            <h3 className="font-bold" style={{ fontFamily: "Space Grotesk", color: C.text }}>Ada yang Ultah! 🎂</h3>
          </div>
          <div className="space-y-2">
            {birthdays.slice(0, 3).map(({ person, bday }) => (
              <div key={person.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.surface }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{person.name}</span>
                </div>
                <Badge C={C} tone={bday.days === 0 ? "pink" : "gold"} small>
                  {bday.days === 0 ? "Hari ini!" : `${bday.days} hari lagi`} · ke-{bday.nextAge}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CHART */}
      {monthlyTrend.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
            📈 Tren 6 Bulan Terakhir
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.jade} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.jade} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.coral} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" stroke={C.textMuted} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textMuted} fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.text }}
                formatter={(v) => fmtIDRFull(v)} />
              <Area type="monotone" dataKey="Pemasukan" stroke={C.jade} strokeWidth={2.5} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="Pengeluaran" stroke={C.coral} strokeWidth={2.5} fill="url(#gExpense)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
              <span className="w-3 h-3 rounded-full" style={{ background: C.jade }} /> Pemasukan
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
              <span className="w-3 h-3 rounded-full" style={{ background: C.coral }} /> Pengeluaran
            </div>
          </div>
        </div>
      )}

      {/* UPCOMING BILLS */}
      {dueSoon.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
              🔔 Tagihan Mendekat
            </h3>
            <button onClick={() => setTab("bills")} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }}>
              Semua <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {dueSoon.map((b) => {
              const overdue = new Date(b.dueDate) < new Date(new Date().toDateString());
              const daysLeft = Math.ceil((new Date(b.dueDate) - new Date(new Date().toDateString())) / 86400000);
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.surface2 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: overdue ? C.coralSoft : C.goldSoft }}>
                    {overdue ? <AlertTriangle size={18} color={C.coral} /> : <Clock size={18} color={C.gold} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{b.name}</div>
                    <div className="text-xs" style={{ color: overdue ? C.coral : C.textMuted }}>
                      {overdue ? `Terlambat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`} · {fmtDateShort(b.dueDate)}
                    </div>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ fontFamily: "JetBrains Mono", color: C.text }}>
                    {fmtIDR(b.amount - b.paidAmount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECENT TX */}
      <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
            📋 Transaksi Terbaru
          </h3>
          <button onClick={() => setTab("tx")} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }}>
            Lihat semua <ChevronRight size={14} />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Belum ada transaksi"
            description="Yuk mulai catat pemasukan dan pengeluaran kamu!"
            action={{ label: "Catat Sekarang", onClick: () => setTxModal("new") }}
            C={C}
          />
        ) : (
          <div className="space-y-2">
            {recent.map((t) => {
              const cat = getCat(t.category);
              return (
                <motion.div
                  key={t.id} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: C.surface2 }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                    style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                    {t.type === "income" ? "💰" : (cat.emoji || "📦")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{t.note}</div>
                    <div className="text-xs flex items-center gap-1.5" style={{ color: C.textMuted }}>
                      <span>{projectName(t.projectId)}</span>
                      <span>·</span>
                      <span>{fmtDateShort(t.date)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{
                    fontFamily: "JetBrains Mono",
                    color: t.type === "income" ? C.jade : C.text,
                  }}>
                    {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== PROJECTS VIEW =====
function ProjectsView({ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin }) {
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
            🏢 Usaha & Kawasan
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>{projects.length} usaha aktif</p>
        </div>
        {isAdmin && (
          <motion.button
            whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
            onClick={() => setProjModal("new")}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: C.gradient1, color: "#fff" }}
          >
            <Plus size={20} />
          </motion.button>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4" style={{ background: C.jadeSoft }}>
          <div className="text-xs font-semibold mb-1" style={{ color: C.jade }}>Total Pemasukan</div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>{fmtIDR(totalIncome)}</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: C.coralSoft }}>
          <div className="text-xs font-semibold mb-1" style={{ color: C.coral }}>Total Pengeluaran</div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>{fmtIDR(totalExpense)}</div>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          emoji="🏗️"
          title="Belum ada usaha"
          description="Tambahkan usaha atau kawasan yang kamu kelola untuk mulai mencatat keuangan"
          action={isAdmin ? { label: "Tambah Usaha", onClick: () => setProjModal("new") } : null}
          C={C}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p, idx) => {
            const tx = transactions.filter((t) => t.projectId === p.id);
            const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const balance = income - spent;
            const txCount = tx.length;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.98 }} whileHover={{ y: -4 }}
                onClick={() => { setActiveProject(p.id); setTab("home"); }}
                className="rounded-3xl overflow-hidden cursor-pointer shadow-md"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <div className="relative h-24 p-4 flex items-end" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }}>
                  <div className="absolute top-3 right-3 text-4xl opacity-20">🏢</div>
                  {isAdmin && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setProjModal(p); }}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff" }}
                    >
                      <Pencil size={13} />
                    </motion.button>
                  )}
                  <div className="relative">
                    <div className="font-bold text-lg" style={{ fontFamily: "Space Grotesk", color: "#fff" }}>{p.name}</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                      <MapPin size={10} /> {p.location}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {p.desc && <p className="text-xs mb-3 line-clamp-2" style={{ color: C.textMuted, lineHeight: 1.5 }}>{p.desc}</p>}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: C.jade }}>↑ MASUK</div>
                      <div className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: C.text }}>{fmtIDR(income)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: C.coral }}>↓ KELUAR</div>
                      <div className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: C.text }}>{fmtIDR(spent)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 text-xs" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}>
                      <span className="font-semibold" style={{ color: balance >= 0 ? C.jade : C.coral, fontFamily: "JetBrains Mono" }}>
                        {fmtIDR(balance)}
                      </span> saldo
                    </span>
                    <Badge C={C} tone="primary" small>{txCount} transaksi</Badge>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ===== TRANSACTIONS VIEW =====
function TransactionsView({ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin, categories, getCat }) {
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const rows = useMemo(() => {
    return transactions
      .filter((t) => activeProject === "all" || t.projectId === activeProject)
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) => t.note.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, activeProject, filterType, q]);

  // Group by date
  const grouped = useMemo(() => {
    const g = {};
    rows.forEach((t) => {
      if (!g[t.date]) g[t.date] = [];
      g[t.date].push(t);
    });
    return g;
  }, [rows]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
            📋 Riwayat
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>{rows.length} transaksi</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
          onClick={() => setTxModal("new")}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: C.gradient1, color: "#fff" }}
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color={C.textMuted} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari transaksi..."
            style={{ ...inputStyle(C), paddingLeft: 40 }} />
        </div>
        <div className="flex gap-2">
          {[{ id: "all", label: "Semua" }, { id: "income", label: "Masuk", emoji: "💰" }, { id: "expense", label: "Keluar", emoji: "💸" }].map((f) => (
            <motion.button
              key={f.id} whileTap={{ scale: 0.95 }}
              onClick={() => setFilterType(f.id)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
              style={{
                background: filterType === f.id ? C.gradient1 : C.surface2,
                color: filterType === f.id ? "#fff" : C.textMuted,
                border: `1px solid ${filterType === f.id ? "transparent" : C.border}`,
              }}
            >
              {f.emoji && <span>{f.emoji}</span>} {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          emoji={q ? "🔍" : "📝"}
          title={q ? "Tidak ditemukan" : "Belum ada transaksi"}
          description={q ? `Tidak ada hasil untuk "${q}"` : "Mulai catat pemasukan & pengeluaranmu di sini!"}
          action={!q ? { label: "Catat Transaksi", onClick: () => setTxModal("new") } : null}
          C={C}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, txs]) => {
            const dayIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold" style={{ color: C.textMuted }}>{fmtDate(date)}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {dayIncome > 0 && <span style={{ color: C.jade, fontFamily: "JetBrains Mono", fontWeight: 600 }}>+{fmtIDR(dayIncome)}</span>}
                    {dayExpense > 0 && <span style={{ color: C.coral, fontFamily: "JetBrains Mono", fontWeight: 600 }}>-{fmtIDR(dayExpense)}</span>}
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  {txs.map((t, i) => {
                    const cat = getCat(t.category);
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-3.5 transition-colors"
                        style={{ borderTop: i === 0 ? "none" : `1px solid ${C.borderSoft}` }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                          style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                          {t.type === "income" ? "💰" : (cat.emoji || "📦")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{t.note}</div>
                          <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: C.textMuted }}>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: projectColor(t.projectId) }} />
                              {projectName(t.projectId)}
                            </span>
                            {t.type === "expense" && (
                              <>
                                <span>·</span>
                                <span>{cat.label}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-bold shrink-0" style={{ fontFamily: "JetBrains Mono", color: t.type === "income" ? C.jade : C.text }}>
                          {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => setTxModal(t)} className="p-1.5 rounded-lg" style={{ color: C.textFaint }}><Pencil size={13} /></button>
                            <button onClick={() => { if (confirm("Hapus transaksi ini?")) setTransactions((p) => p.filter((x) => x.id !== t.id)); }} className="p-1.5 rounded-lg" style={{ color: C.coral }}><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ===== BILLS TAB (Tagihan, Tabungan, Hutang) =====
function BillsTab({ C, bills, setBills, goals, setGoals, debts, setDebts, projects, projectName, setBillModal, setGoalModal, setDebtModal, isAdmin, getCat, activeProject, setTransactions }) {
  const [subTab, setSubTab] = useState("bills");
  const today = new Date(new Date().toDateString());

  const filtBills = bills.filter((b) => activeProject === "all" || b.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const filtGoals = goals.filter((g) => activeProject === "all" || g.projectId === activeProject || g.projectId === "all");
  const filtDebts = debts.filter((d) => activeProject === "all" || d.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const tabs = [
    { id: "bills", label: "Tagihan", emoji: "🔔", count: filtBills.filter((b) => b.paidAmount < b.amount).length },
    { id: "goals", label: "Target", emoji: "🎯", count: filtGoals.filter((g) => g.current < g.target).length },
    { id: "debts", label: "Hutang", emoji: "💳", count: filtDebts.filter((d) => d.paidAmount < d.amount).length },
  ];

  const payBill = (amt, bill) => {
    setBills((p) => p.map((b) => (b.id === bill.id ? { ...b, paidAmount: Math.min(b.amount, b.paidAmount + amt) } : b)));
    setTransactions((p) => [{ id: uid("t"), type: "expense", projectId: bill.projectId, category: bill.category || "belanja", amount: amt, date: new Date().toISOString().slice(0, 10), note: `Bayar: ${bill.name}` }, ...p]);
  };
  const payGoal = (amt, goal) => {
    setGoals((p) => p.map((g) => (g.id === goal.id ? { ...g, current: g.current + amt } : g)));
    const pid = goal.projectId === "all" ? (projects[0]?.id || "") : goal.projectId;
    if (pid) setTransactions((p) => [{ id: uid("t"), type: "expense", projectId: pid, category: "tabungan", amount: amt, date: new Date().toISOString().slice(0, 10), note: `Setor: ${goal.name}` }, ...p]);
  };
  const payDebt = (amt, debt) => {
    setDebts((p) => p.map((d) => (d.id === debt.id ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)));
    setTransactions((p) => [{ id: uid("t"), type: "expense", projectId: debt.projectId, category: "belanja", amount: amt, date: new Date().toISOString().slice(0, 10), note: `Cicil: ${debt.name}` }, ...p]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
          🔔 Tagihan & Target
        </h1>
        {isAdmin && (
          <motion.button
            whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
            onClick={() => { if (subTab === "bills") setBillModal("new"); else if (subTab === "goals") setGoalModal("new"); else setDebtModal("new"); }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: C.gradient1, color: "#fff" }}
          >
            <Plus size={20} />
          </motion.button>
        )}
      </div>

      {/* SUB TABS */}
      <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => (
          <motion.button
            key={t.id} whileTap={{ scale: 0.95 }}
            onClick={() => setSubTab(t.id)}
            className="px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0"
            style={{
              background: subTab === t.id ? C.gradient1 : C.surface,
              color: subTab === t.id ? "#fff" : C.text,
              border: `1px solid ${subTab === t.id ? "transparent" : C.border}`,
            }}
          >
            <span>{t.emoji}</span> {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: subTab === t.id ? "rgba(255,255,255,0.25)" : C.primarySoft, color: subTab === t.id ? "#fff" : C.primary }}>
                {t.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {subTab === "bills" && (
        filtBills.length === 0 ? (
          <EmptyState emoji="🔔" title="Belum ada tagihan"
            description="Tambah tagihan rutin seperti listrik, PDAM, atau sewa agar tidak lupa bayar"
            action={isAdmin ? { label: "Tambah Tagihan", onClick: () => setBillModal("new") } : null} C={C} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtBills.map((b) => {
              const cat = getCat(b.category || "belanja");
              const isPaid = b.paidAmount >= b.amount;
              const due = new Date(b.dueDate);
              const overdue = !isPaid && due < today;
              const soon = !isPaid && !overdue && (due - today) / 86400000 <= 5;
              const pct = b.amount ? (b.paidAmount / b.amount) * 100 : 0;
              const daysLeft = Math.ceil((due - today) / 86400000);
              return (
                <motion.div
                  key={b.id} whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                        style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : `${cat.color}22` }}>
                        {isPaid ? "✅" : overdue ? "⚠️" : (cat.emoji || "🔔")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate" style={{ fontFamily: "Space Grotesk", fontSize: 16, color: C.text }}>{b.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(b.projectId)} · {b.recurring}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setBillModal(b)} className="p-1.5 rounded-lg" style={{ color: C.textFaint }}><Pencil size={13} /></button>
                        <button onClick={() => { if (confirm(`Hapus "${b.name}"?`)) setBills((p) => p.filter((x) => x.id !== b.id)); }} className="p-1.5 rounded-lg" style={{ color: C.coral }}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>{fmtIDR(b.paidAmount)}</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(b.amount)}</span>
                  </div>
                  <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={8} />
                  <div className="flex items-center justify-between mt-3">
                    <Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>
                      {isPaid ? "✅ Lunas" : overdue ? `⚠️ Terlambat ${Math.abs(daysLeft)}h` : soon ? `⏰ ${daysLeft}h lagi` : `${daysLeft} hari lagi`}
                    </Badge>
                    {!isPaid && (
                      <QuickPayBtn C={C} label="Bayar" onPay={(amt) => payBill(amt, b)} max={b.amount - b.paidAmount} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {subTab === "goals" && (
        filtGoals.length === 0 ? (
          <EmptyState emoji="🎯" title="Belum ada target"
            description="Buat target tabungan untuk rencana masa depan kawasanmu"
            action={isAdmin ? { label: "Buat Target", onClick: () => setGoalModal("new") } : null} C={C} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtGoals.map((g) => {
              const pct = g.target ? (g.current / g.target) * 100 : 0;
              const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
              return (
                <motion.div key={g.id} whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="absolute top-0 right-0 text-[100px] opacity-10 leading-none select-none pointer-events-none">🎯</div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold" style={{ fontFamily: "Space Grotesk", fontSize: 16, color: C.text }}>{g.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(g.projectId === "all" ? undefined : g.projectId) || "✨ Seluruh Kawasan"}</div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setGoalModal(g)} className="p-1.5 rounded-lg" style={{ color: C.textFaint }}><Pencil size={13} /></button>
                          <button onClick={() => { if (confirm(`Hapus "${g.name}"?`)) setGoals((p) => p.filter((x) => x.id !== g.id)); }} className="p-1.5 rounded-lg" style={{ color: C.coral }}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: C.text }}>{fmtIDR(g.current)}</span>
                      <span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(g.target)}</span>
                    </div>
                    <ProgressBar pct={pct} color={C.jade} C={C} height={8} />
                    <div className="flex items-center justify-between mt-3">
                      <Badge C={C} tone="jade">{pct.toFixed(0)}% tercapai</Badge>
                      <QuickPayBtn C={C} label="Setor" onPay={(amt) => payGoal(amt, g)} max={g.target - g.current} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {subTab === "debts" && (
        filtDebts.length === 0 ? (
          <EmptyState emoji="💳" title="Tidak ada hutang"
            description="Alhamdulillah! Kamu belum memiliki hutang yang tercatat 🎉"
            action={isAdmin ? { label: "Tambah Hutang", onClick: () => setDebtModal("new") } : null} C={C} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtDebts.map((d) => {
              const isPaid = d.paidAmount >= d.amount;
              const due = new Date(d.dueDate);
              const overdue = !isPaid && due < today;
              const pct = d.amount ? (d.paidAmount / d.amount) * 100 : 0;
              return (
                <motion.div key={d.id} whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                        style={{ background: isPaid ? C.jadeSoft : C.goldSoft }}>
                        {isPaid ? "✅" : "💳"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate" style={{ fontFamily: "Space Grotesk", fontSize: 16, color: C.text }}>{d.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(d.projectId)} · {d.recurring}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setDebtModal(d)} className="p-1.5 rounded-lg" style={{ color: C.textFaint }}><Pencil size={13} /></button>
                        <button onClick={() => { if (confirm(`Hapus "${d.name}"?`)) setDebts((p) => p.filter((x) => x.id !== d.id)); }} className="p-1.5 rounded-lg" style={{ color: C.coral }}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: C.text }}>{fmtIDR(d.paidAmount)}</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(d.amount)}</span>
                  </div>
                  <ProgressBar pct={pct} color={isPaid ? C.jade : C.gold} C={C} height={8} />
                  <div className="flex items-center justify-between mt-3">
                    <Badge C={C} tone={isPaid ? "jade" : "gold"}>{isPaid ? "✅ Lunas" : `${pct.toFixed(0)}% terlunasi`}</Badge>
                    {!isPaid && <QuickPayBtn C={C} label="Cicil" onPay={(amt) => payDebt(amt, d)} max={d.amount - d.paidAmount} />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </motion.div>
  );
}

function QuickPayBtn({ C, label, onPay, max }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");
  return (
    <>
      <motion.button whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
        style={{ background: C.gradient1, color: "#fff" }}>
        <Plus size={12} /> {label}
      </motion.button>
      {open && createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}>
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: "Space Grotesk", color: C.text, fontSize: 18 }}>{label} Sekarang</h3>
            <div className="mb-3 p-3 rounded-xl" style={{ background: C.surface2 }}>
              <div className="text-xs mb-1" style={{ color: C.textMuted }}>Maksimal</div>
              <div className="font-bold" style={{ fontFamily: "JetBrains Mono", color: C.text }}>{fmtIDRFull(max)}</div>
            </div>
            <Field label="Jumlah" C={C}>
              <AmountInput value={amt} onChange={setAmt} C={C} />
            </Field>
            <PrimaryButton C={C} disabled={!Number(amt) || Number(amt) > max}
              onClick={() => { if (Number(amt) > 0) { onPay(Number(amt)); setOpen(false); setAmt(""); } }}>
              ✓ Konfirmasi
            </PrimaryButton>
          </motion.div>
        </motion.div>, document.body
      )}
    </>
  );
}

// ===== PROFILE VIEW =====
function ProfileView({ C, user, onLogout, people, setPeople, projects, projectName, setPersonModal, isAdmin, activeProject, categories, setCategories, setCatModal, isDark, setIsDark, totals, transactions }) {
  const [filter, setFilter] = useState("all");
  const rows = people.filter((p) => (filter === "all" || p.category === filter) && (activeProject === "all" || p.projectId === activeProject));
  const staffL = people.filter((p) => p.category === "staff-l").length;
  const staffP = people.filter((p) => p.category === "staff-p").length;
  const anak = people.filter((p) => p.category === "anak").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
      {/* PROFILE CARD */}
      <div className="rounded-3xl p-6 mb-5 relative overflow-hidden" style={{ background: C.gradient1 }}>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: "#fff" }} />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
              {user?.role === "admin" ? "👑" : "👤"}
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 800, color: "#fff" }}>{user?.name}</div>
              <Badge C={C} tone="primary">
                {user?.role === "admin" ? "🛡️ Administrator" : "👥 Staff"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>Saldo</div>
              <div className="text-sm font-bold" style={{ color: "#fff", fontFamily: "JetBrains Mono" }}>{fmtIDR(totals.balance)}</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>Usaha</div>
              <div className="text-sm font-bold" style={{ color: "#fff", fontFamily: "JetBrains Mono" }}>{projects.length}</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>Transaksi</div>
              <div className="text-sm font-bold" style={{ color: "#fff", fontFamily: "JetBrains Mono" }}>{transactions.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <button onClick={() => setIsDark((d) => !d)}
          className="w-full flex items-center justify-between p-4 transition-colors"
          style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.primarySoft }}>
              {isDark ? <Moon size={16} color={C.primary} /> : <Sun size={16} color={C.primary} />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold" style={{ color: C.text }}>Tampilan</div>
              <div className="text-xs" style={{ color: C.textMuted }}>{isDark ? "Mode gelap" : "Mode terang"}</div>
            </div>
          </div>
          <ChevronRight size={16} color={C.textMuted} />
        </button>
        {isAdmin && (
          <button onClick={() => setCatModal(true)}
            className="w-full flex items-center justify-between p-4 transition-colors"
            style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.goldSoft }}>
                <Tag size={16} color={C.gold} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: C.text }}>Kelola Kategori</div>
                <div className="text-xs" style={{ color: C.textMuted }}>{categories.length} kategori aktif</div>
              </div>
            </div>
            <ChevronRight size={16} color={C.textMuted} />
          </button>
        )}
        <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 transition-colors">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.coralSoft }}>
            <LogOut size={16} color={C.coral} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: C.coral }}>Keluar</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Logout dari akun ini</div>
          </div>
        </button>
      </div>

      {/* DATA AHLI */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "Space Grotesk", color: C.text }}>
          👥 Data Ahli
        </h2>
        {isAdmin && (
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setPersonModal("new")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            style={{ background: C.gradient1, color: "#fff" }}>
            <Plus size={12} /> Tambah
          </motion.button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-2xl p-3 text-center" style={{ background: C.blueSoft }}>
          <div className="text-2xl mb-1">👨</div>
          <div className="font-bold" style={{ fontFamily: "JetBrains Mono", fontSize: 18, color: C.text }}>{staffL}</div>
          <div className="text-[10px] font-semibold" style={{ color: C.blue }}>Staff L</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: C.secondarySoft }}>
          <div className="text-2xl mb-1">👩</div>
          <div className="font-bold" style={{ fontFamily: "JetBrains Mono", fontSize: 18, color: C.text }}>{staffP}</div>
          <div className="text-[10px] font-semibold" style={{ color: C.secondary }}>Staff P</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: C.jadeSoft }}>
          <div className="text-2xl mb-1">👶</div>
          <div className="font-bold" style={{ fontFamily: "JetBrains Mono", fontSize: 18, color: C.text }}>{anak}</div>
          <div className="text-[10px] font-semibold" style={{ color: C.jade }}>Anak</div>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[{ id: "all", label: "Semua" }, { id: "staff-l", label: "👨 Staff L" }, { id: "staff-p", label: "👩 Staff P" }, { id: "anak", label: "👶 Anak" }].map((f) => (
          <motion.button key={f.id} whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
            style={{
              background: filter === f.id ? C.gradient1 : C.surface2,
              color: filter === f.id ? "#fff" : C.textMuted,
            }}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="👥" title="Belum ada data"
          description="Tambah data staff atau anak di kawasan ini"
          action={isAdmin ? { label: "Tambah Data", onClick: () => setPersonModal("new") } : null} C={C} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((p) => {
            const bday = daysUntilBirthday(p.birthDate);
            const emoji = p.category === "anak" ? "👶" : p.category === "staff-p" ? "👩" : "👨";
            return (
              <motion.div key={p.id} whileTap={{ scale: 0.98 }}
                className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: C.primarySoft }}>
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate" style={{ fontFamily: "Space Grotesk", fontSize: 15, color: C.text }}>{p.name}</div>
                      <div className="text-xs" style={{ color: C.textMuted }}>{projectName(p.projectId)}</div>
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => setPersonModal(p)} className="p-1.5 rounded-lg" style={{ color: C.textFaint }}><Pencil size={13} /></button>}
                </div>
                <div className="space-y-1 text-xs mt-3" style={{ color: C.textMuted }}>
                  {p.birthPlace && <div>📍 {p.birthPlace}{p.birthDate ? `, ${fmtDateShort(p.birthDate)}` : ""}</div>}
                  {p.fatherName && <div>👨 Ayah: <span style={{ color: C.text }}>{p.fatherName}</span></div>}
                  {p.motherName && <div>👩 Ibu: <span style={{ color: C.text }}>{p.motherName}</span></div>}
                </div>
                {bday && bday.days <= 30 && (
                  <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <Cake size={14} color={C.gold} />
                    <span className="text-xs font-semibold" style={{ color: C.gold }}>
                      {bday.days === 0 ? "🎉 Ultah hari ini!" : `🎂 ${bday.days} hari lagi · ke-${bday.nextAge}`}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ===== MODALS (mostly unchanged logic, fresh UI) =====

function AddTransactionModal({ open, onClose, C, projects, goals, debts, categories, editing, onAddTransaction, onEditTransaction, onContributeGoal, onPayDebt }) {
  const [type, setType] = useState("expense");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [debtId, setDebtId] = useState(debts?.[0]?.id || "");
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setType(editing.type); setProjectId(editing.projectId); setCategory(editing.category);
      setAmount(String(editing.amount)); setDate(editing.date); setNote(editing.note);
    } else if (open && !editing) {
      setType("expense"); setProjectId(projects[0]?.id || ""); setCategory(categories[0]?.id || "");
      setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setNote("");
    }
  }, [open, editing, projects, categories]);

  const selectedDebt = (debts || []).find((d) => d.id === debtId);
  const remainingDebt = selectedDebt ? Math.max(0, selectedDebt.amount - selectedDebt.paidAmount) : 0;

  const submit = () => {
    const amt = Number(String(amount).replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) return;
    if (isEditing) {
      if (!note || !projectId) return;
      onEditTransaction(editing.id, { type, projectId, category: type === "income" ? categories[0]?.id : category, amount: amt, date, note });
      onClose(); return;
    }
    if (type === "goal") {
      const g = goals.find((x) => x.id === goalId); if (!g) return;
      onAddTransaction({ type: "expense", projectId: g.projectId === "all" ? (projects[0]?.id || "") : g.projectId, category: "tabungan", amount: amt, date, note: note || `Setor ke tabungan: ${g.name}` });
      onContributeGoal(goalId, amt);
    } else if (type === "debt") {
      const d = (debts || []).find((x) => x.id === debtId); if (!d) return;
      onAddTransaction({ type: "expense", projectId: d.projectId, category: categories[0]?.id, amount: amt, date, note: note || `Cicilan hutang: ${d.name}` });
      onPayDebt(debtId, amt);
    } else {
      if (!note || !projectId) return;
      onAddTransaction({ type, projectId, category: type === "income" ? categories[0]?.id : category, amount: amt, date, note });
    }
    onClose();
  };

  const TYPES = [
    { id: "expense", label: "💸 Pengeluaran", color: C.coral },
    { id: "income", label: "💰 Pemasukan", color: C.jade },
    ...(!isEditing ? [
      { id: "goal", label: "🐷 Tabungan", color: C.blue },
      { id: "debt", label: "💳 Hutang", color: C.gold },
    ] : []),
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Transaksi" : "Catat Uang"} C={C} icon={<Receipt size={18} color={C.primary} />}>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {TYPES.map((tp) => (
          <motion.button key={tp.id} whileTap={{ scale: 0.95 }}
            onClick={() => setType(tp.id)}
            className="p-3 rounded-2xl text-xs font-bold transition-all"
            style={{
              background: type === tp.id ? tp.color : C.surface2,
              color: type === tp.id ? "#fff" : C.textMuted,
              border: `1px solid ${type === tp.id ? "transparent" : C.border}`,
            }}>
            {tp.label}
          </motion.button>
        ))}
      </div>

      {(type === "expense" || type === "income") && (
        <>
          <Field label="Pilih Usaha" C={C}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
              {projects.length === 0 && <option value="">(Buat usaha dulu)</option>}
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {type === "expense" && (
            <Field label="Kategori" C={C}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          )}
        </>
      )}

      {type === "goal" && !isEditing && (
        <Field label="Target Tabungan" C={C}>
          {goals.length === 0 ? <div className="text-xs py-3 text-center" style={{ color: C.textFaint }}>Belum ada target 🎯</div> : (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={inputStyle(C)}>
              {goals.map((g) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
            </select>
          )}
        </Field>
      )}

      {type === "debt" && !isEditing && (
        <Field label="Pilih Hutang" C={C}>
          {(!debts || debts.length === 0) ? <div className="text-xs py-3 text-center" style={{ color: C.textFaint }}>Belum ada hutang</div> : (
            <>
              <select value={debtId} onChange={(e) => setDebtId(e.target.value)} style={inputStyle(C)}>
                {debts.map((d) => <option key={d.id} value={d.id}>💳 {d.name} (sisa {fmtIDR(Math.max(0, d.amount - d.paidAmount))})</option>)}
              </select>
              {selectedDebt && <div className="text-xs mt-2 p-2 rounded-lg" style={{ background: C.goldSoft, color: C.gold }}>Sisa: {fmtIDRFull(remainingDebt)}</div>}
            </>
          )}
        </Field>
      )}

      <Field label="Jumlah" C={C}>
        <AmountInput value={amount} onChange={setAmount} C={C} />
      </Field>

      <Field label="Tanggal" C={C}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle(C)} />
      </Field>

      {(type === "expense" || type === "income") && (
        <Field label="Catatan" C={C}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Bayar listrik bulan ini" style={inputStyle(C)} />
        </Field>
      )}
      {(type === "goal" || type === "debt") && !isEditing && (
        <Field label="Catatan (opsional)" C={C} hint="Kosongkan untuk pakai catatan otomatis">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan tambahan..." style={inputStyle(C)} />
        </Field>
      )}

      <PrimaryButton C={C} onClick={submit}>
        {isEditing ? "💾 Simpan Perubahan" : "✨ Simpan Transaksi"}
      </PrimaryButton>
    </Modal>
  );
}

function AddGoalModal({ open, onClose, C, projects, editing, onSave }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) { setName(editing.name); setProjectId(editing.projectId); setTarget(String(editing.target)); setDeadline(editing.deadline); }
    else if (open && !editing) { setName(""); setProjectId("all"); setTarget(""); setDeadline(""); }
  }, [open, editing]);
  const submit = () => {
    const t = Number(String(target).replace(/[^0-9]/g, ""));
    if (!name || !t || !deadline) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, target: t, deadline }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Target" : "Buat Target Baru"} C={C} icon={<Target size={18} color={C.primary} />}>
      <Field label="Nama Target" C={C} hint="Contoh: Dana renovasi masjid">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mau nabung untuk apa?" style={inputStyle(C)} />
      </Field>
      <Field label="Untuk Kawasan" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          <option value="all">✨ Seluruh Kawasan</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Target Dana" C={C}>
        <AmountInput value={target} onChange={setTarget} C={C} />
      </Field>
      <Field label="Target Tercapai" C={C}>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle(C)} />
      </Field>
      <PrimaryButton C={C} onClick={submit}>{isEditing ? "💾 Simpan" : "🎯 Buat Target"}</PrimaryButton>
    </Modal>
  );
}

function AddBillModal({ open, onClose, C, projects, categories, editing, onSave }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState("Bulanan");
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) { setName(editing.name); setProjectId(editing.projectId); setCategory(editing.category || categories[0]?.id); setAmount(String(editing.amount)); setDueDate(editing.dueDate); setRecurring(editing.recurring); }
    else if (open && !editing) { setName(""); setProjectId(projects[0]?.id || ""); setCategory(categories[0]?.id || ""); setAmount(""); setDueDate(""); setRecurring("Bulanan"); }
  }, [open, editing, projects, categories]);
  const submit = () => {
    const a = Number(String(amount).replace(/[^0-9]/g, ""));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, category, amount: a, dueDate, recurring }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Tagihan" : "Tagihan Baru"} C={C} icon={<Bell size={18} color={C.primary} />}>
      <Field label="Nama Tagihan" C={C} hint="Contoh: Listrik bulan ini">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apa tagihannya?" style={inputStyle(C)} />
      </Field>
      <Field label="Untuk Usaha" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.length === 0 && <option value="">(Kosong)</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Kategori" C={C}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Jumlah" C={C}><AmountInput value={amount} onChange={setAmount} C={C} /></Field>
      <Field label="Jatuh Tempo" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Berulang?" C={C}>
        <select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>
          {["Bulanan", "Tahunan", "Sekali"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <PrimaryButton C={C} onClick={submit}>{isEditing ? "💾 Simpan" : "🔔 Simpan Tagihan"}</PrimaryButton>
    </Modal>
  );
}

function AddProjectModal({ open, onClose, C, editing, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [manager, setManager] = useState("");
  const [desc, setDesc] = useState("");
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) { setName(editing.name); setLocation(editing.location); setBudget(String(editing.budget)); setManager(editing.manager || ""); setDesc(editing.desc || ""); }
    else if (open && !editing) { setName(""); setLocation(""); setBudget(""); setManager(""); setDesc(""); }
  }, [open, editing]);
  const submit = () => {
    const b = Number(String(budget).replace(/[^0-9]/g, ""));
    if (!name || !location || !b) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, location, budget: b, manager, desc }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Usaha" : "Usaha Baru"} C={C} icon={<Building2 size={18} color={C.primary} />}>
      <Field label="Nama Usaha" C={C}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Villa Amerta" style={inputStyle(C)} />
      </Field>
      <Field label="Lokasi" C={C}>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Kuta, Bali" style={inputStyle(C)} />
      </Field>
      <Field label="Anggaran Bulanan" C={C}><AmountInput value={budget} onChange={setBudget} C={C} /></Field>
      <Field label="Penanggung Jawab" C={C}>
        <input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Siapa yang jaga?" style={inputStyle(C)} />
      </Field>
      <Field label="Deskripsi (opsional)" C={C}>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ceritakan sedikit..." style={inputStyle(C)} />
      </Field>
      <PrimaryButton C={C} onClick={submit}>{isEditing ? "💾 Simpan" : "🏢 Tambah Usaha"}</PrimaryButton>
    </Modal>
  );
}

function AddDebtModal({ open, onClose, C, projects, editing, onSave }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState("Cicilan Bulanan");
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) { setName(editing.name); setProjectId(editing.projectId); setAmount(String(editing.amount)); setPaidAmount(String(editing.paidAmount ?? 0)); setDueDate(editing.dueDate); setRecurring(editing.recurring); }
    else if (open && !editing) { setName(""); setProjectId(projects[0]?.id || ""); setAmount(""); setPaidAmount("0"); setDueDate(""); setRecurring("Cicilan Bulanan"); }
  }, [open, editing, projects]);
  const submit = () => {
    const a = Number(String(amount).replace(/[^0-9]/g, ""));
    const p = Number(String(paidAmount).replace(/[^0-9]/g, ""));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, amount: a, paidAmount: p || 0, dueDate, recurring }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Hutang" : "Hutang Baru"} C={C} icon={<HandCoins size={18} color={C.primary} />}>
      <Field label="Nama Hutang / Kreditur" C={C}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Pinjaman bank" style={inputStyle(C)} />
      </Field>
      <Field label="Usaha" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.length === 0 && <option value="">(Kosong)</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Total Hutang" C={C}><AmountInput value={amount} onChange={setAmount} C={C} /></Field>
      <Field label="Sudah Dibayar" C={C}><AmountInput value={paidAmount} onChange={setPaidAmount} C={C} /></Field>
      <Field label="Target Lunas" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Skema" C={C}>
        <select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>
          {["Cicilan Bulanan", "Sekali", "Tahunan"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <PrimaryButton C={C} onClick={submit}>{isEditing ? "💾 Simpan" : "💳 Simpan Hutang"}</PrimaryButton>
    </Modal>
  );
}

const PEOPLE_CATEGORIES = [
  { id: "staff-l", label: "Staff Laki-laki", emoji: "👨" },
  { id: "staff-p", label: "Staff Perempuan", emoji: "👩" },
  { id: "anak", label: "Anak", emoji: "👶" },
];

function AddPersonModal({ open, onClose, C, projects, editing, onSave }) {
  const [category, setCategory] = useState("staff-l");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [childrenCount, setChildrenCount] = useState("0");
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) { setCategory(editing.category); setProjectId(editing.projectId); setName(editing.name); setFatherName(editing.fatherName || ""); setMotherName(editing.motherName || ""); setBirthPlace(editing.birthPlace || ""); setBirthDate(editing.birthDate || ""); setSpouseName(editing.spouseName || ""); setChildrenCount(String(editing.childrenCount ?? 0)); }
    else if (open && !editing) { setCategory("staff-l"); setProjectId(projects[0]?.id || ""); setName(""); setFatherName(""); setMotherName(""); setBirthPlace(""); setBirthDate(""); setSpouseName(""); setChildrenCount("0"); }
  }, [open, editing, projects]);
  const isChild = category === "anak";
  const submit = () => {
    const cc = Number(String(childrenCount).replace(/[^0-9]/g, ""));
    if (!name) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), category, projectId, name, fatherName, motherName, birthPlace, birthDate, spouseName: isChild ? "" : spouseName, childrenCount: isChild ? 0 : cc || 0 }); onClose();
  };
  const catEmoji = PEOPLE_CATEGORIES.find((c) => c.id === category)?.emoji || "👤";
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Data Ahli" : "Data Ahli Baru"} C={C} icon={<span className="text-2xl">{catEmoji}</span>}>
      <Field label="Kategori" C={C}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
          {PEOPLE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </Field>
      <Field label="Usaha / Kawasan" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.length === 0 && <option value="">(Kosong)</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Nama Lengkap" C={C}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" style={inputStyle(C)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Ayah" C={C}>
          <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Ayah" style={inputStyle(C)} />
        </Field>
        <Field label="Nama Ibu" C={C}>
          <input value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Ibu" style={inputStyle(C)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tempat Lahir" C={C}>
          <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Kota" style={inputStyle(C)} />
        </Field>
        <Field label="Tanggal Lahir" C={C}>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle(C)} />
        </Field>
      </div>
      {!isChild && (
        <>
          <Field label="Nama Istri / Suami" C={C}>
            <input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} placeholder="Kosongkan jika belum" style={inputStyle(C)} />
          </Field>
          <Field label="Jumlah Anak" C={C}>
            <input type="text" inputMode="numeric" value={childrenCount}
              onChange={(e) => setChildrenCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0" style={inputStyle(C)} />
          </Field>
        </>
      )}
      <PrimaryButton C={C} onClick={submit}>{isEditing ? "💾 Simpan" : "👥 Simpan Data"}</PrimaryButton>
    </Modal>
  );
}

function ManageCategoriesModal({ open, onClose, C, categories, setCategories }) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const EMOJIS = ["📦", "🍽️", "🚗", "💊", "🎮", "📚", "🏥", "💼", "🎁", "🔧", "✈️", "🏋️", "🎵", "📱", "🐾"];
  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories((p) => [...p, { id: "cat_" + Date.now(), label: `${newEmoji} ${newName.trim()}`, icon: Tag, emoji: newEmoji, color, default: false }]);
    setNewName(""); setNewEmoji("📦");
  };
  const handleDelete = (id) => {
    setCategories((p) => { const n = p.filter((c) => c.id !== id); return n.length > 0 ? n : p; });
  };
  return (
    <Modal open={open} onClose={onClose} title="Kelola Kategori" C={C} icon={<Tag size={18} color={C.primary} />}>
      <div className="space-y-2 mb-5 max-h-56 overflow-y-auto hide-scrollbar pr-1">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.surface2 }}>
            <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: C.text }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${c.color}22` }}>
                {c.emoji || "📦"}
              </div>
              {c.label}
            </div>
            {!c.default && (
              <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg" style={{ color: C.coral }}><Trash2 size={14} /></button>
            )}
          </div>
        ))}
      </div>
      <div className="pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <Field label="Emoji" C={C}>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setNewEmoji(e)}
                className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                style={{ background: newEmoji === e ? C.primarySoft : C.surface2, border: `2px solid ${newEmoji === e ? C.primary : "transparent"}` }}>
                {e}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Nama Kategori" C={C}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Transportasi" style={inputStyle(C)} />
        </Field>
        <Field label="Warna" C={C}>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((col) => (
              <button key={col} onClick={() => setColor(col)}
                className="w-9 h-9 rounded-full transition-all"
                style={{ background: col, border: `3px solid ${color === col ? C.text : "transparent"}` }} />
            ))}
          </div>
        </Field>
        <PrimaryButton C={C} onClick={handleAdd}>➕ Tambah Kategori</PrimaryButton>
      </div>
    </Modal>
  );
}
