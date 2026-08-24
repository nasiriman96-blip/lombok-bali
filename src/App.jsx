import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Building2, Receipt, PiggyBank, Bell, BarChart3,
  Plus, Moon, Sun, Cloud, CloudOff, X, TrendingUp, TrendingDown,
  Wallet, Calendar, MapPin, Trash2, AlertTriangle, CheckCircle2,
  Wrench, Zap, Users, Megaphone, Package, FileText, ShoppingBag,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, ChevronDown,
  Landmark, Sparkles, Clock, PlusCircle, LogOut, ShieldCheck, UserCog, Lock, Menu,
  CreditCard, Droplet, Home, HandCoins, Users2, ArrowRightLeft, Baby, User, Pencil, Tag,
  Calculator, Delete, Cake, Split, Coins, TrendingDown as ProfitIcon
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from "recharts";
import { loadAppData, saveAppData, subscribeAppData, getSession, setSession, clearSession } from "./lib/storage";

const FONT_LINK_ID = "lb-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

const PALETTE = {
  dark: {
    bg: "#0A1412", bgSoft: "#0D1A17", surface: "#11201C", surface2: "#172620",
    border: "#233C33", borderSoft: "#1B2E27", text: "#F2EFE6", textMuted: "#8FA69A",
    textFaint: "#5E7A6E", jade: "#34D8A3", jadeSoft: "rgba(52,216,163,0.12)",
    gold: "#E0B15C", goldSoft: "rgba(224,177,92,0.14)", coral: "#F0725A",
    coralSoft: "rgba(240,114,90,0.14)", blue: "#6FB3D9",
  },
  light: {
    bg: "#F6F4EC", bgSoft: "#EFEBDF", surface: "#FFFFFF", surface2: "#FBF9F2",
    border: "#E3DFCF", borderSoft: "#ECE8DA", text: "#182420", textMuted: "#5C6E64",
    textFaint: "#8A9A90", jade: "#1E9E75", jadeSoft: "rgba(30,158,117,0.10)",
    gold: "#B4842E", goldSoft: "rgba(180,132,46,0.12)", coral: "#D6533B",
    coralSoft: "rgba(214,83,59,0.10)", blue: "#3E7FA8",
  },
};

const PROJECT_COLORS = ["#34D8A3", "#E0B15C", "#6FB3D9", "#F0725A", "#C98BD9", "#8FA69A"];

const DEFAULT_CATEGORIES = [
  { id: "pdam", label: "PDAM", icon: Droplet, color: "#6FB3D9", default: true },
  { id: "listrik", label: "Listrik", icon: Zap, color: "#C98BD9", default: true },
  { id: "belanja", label: "Belanja", icon: ShoppingBag, color: "#34D8A3", default: true },
  { id: "sewa-rumah", label: "Sewa Rumah", icon: Home, color: "#F0725A", default: true },
  { id: "tabungan", label: "Tabungan", icon: PiggyBank, color: "#5FA8D3", default: true },
];

// Persentase default pembagian pemasukan: 70% modal, 30% keuntungan.
// Bisa di-overwrite per projek lewat field modalPercent.
const DEFAULT_MODAL_PERCENT = 70;

const isValidIcon = (icon) =>
  typeof icon === "function" || (icon && typeof icon === "object" && !!icon.$$typeof);

const hydrateCategories = (loaded) => {
  if (!Array.isArray(loaded) || loaded.length === 0) return DEFAULT_CATEGORIES;
  return loaded.map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.id === c.id);
    if (def) return { ...c, icon: def.icon };
    return { ...c, icon: isValidIcon(c.icon) ? c.icon : Tag };
  });
};

const fmtIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s) => new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const daysUntilBirthday = (birthDateStr) => {
  if (!birthDateStr) return null;
  const today = new Date(new Date().toDateString());
  const birth = new Date(birthDateStr + "T00:00:00");
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const days = Math.round((next - today) / 86400000);
  const nextAge = next.getFullYear() - birth.getFullYear();
  return { days, nextAge, date: next };
};

const monthKey = (s) => s.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};

const uid = (p) => p + Math.random().toString(36).slice(2, 9);

// Helper: hitung split pemasukan sebuah transaksi.
// Kalau transaksi bukan pemasukan, return null.
// Kalau transaksi lama belum punya split (backward compat), anggap 100% modal.
const splitIncome = (tx, project) => {
  if (!tx || tx.type !== "income") return null;
  const amt = tx.amount || 0;
  // Kalau sudah punya split tersimpan, pakai itu
  if (tx.splitModal != null && tx.splitProfit != null) {
    return { modal: tx.splitModal, profit: tx.splitProfit, modalPct: tx.splitModalPct ?? DEFAULT_MODAL_PERCENT };
  }
  // Backward compat: pakai percent projek (atau default)
  const pct = project?.modalPercent ?? DEFAULT_MODAL_PERCENT;
  const modal = Math.round((amt * pct) / 100);
  const profit = amt - modal;
  return { modal, profit, modalPct: pct };
};

function ContourLines({ color = "#34D8A3", opacity = 0.14, className = "" }) {
  const paths = [
    "M-20,120 C 80,60 160,180 260,100 S 420,40 520,110",
    "M-20,160 C 90,100 170,220 270,140 S 430,80 520,150",
    "M-20,200 C 100,140 180,260 280,180 S 440,120 520,190",
    "M-20,240 C 110,180 190,300 290,220 S 450,160 520,230",
    "M-20,40 C 70,10 150,110 250,50 S 410,-10 520,50",
  ];
  return (
    <svg className={className} viewBox="0 0 500 280" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeWidth="1" opacity={opacity - i * 0.012} />)}
    </svg>
  );
}

function Card({ C, children, style, className = "", pad = "p-5" }) {
  return <div className={`rounded-2xl ${pad} ${className}`} style={{ background: C.surface, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}

function Badge({ children, tone = "neutral", C }) {
  const map = {
    neutral: { bg: C.surface2, fg: C.textMuted },
    jade: { bg: C.jadeSoft, fg: C.jade },
    gold: { bg: C.goldSoft, fg: C.gold },
    coral: { bg: C.coralSoft, fg: C.coral },
    blue: { bg: `${C.blue}22`, fg: C.blue },
  };
  const s = map[tone] || map.neutral;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.fg }}>{children}</span>;
}

function ProgressBar({ pct, color, C, height = 8 }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: C.surface2, height }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}

function IconBtn({ onClick, children, C, title }) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children, C }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.55)", animation: "lbFadeIn .18s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto" style={{ background: C.surface, border: `1px solid ${C.border}`, animation: "lbSlideUp .22s cubic-bezier(.2,.8,.2,1)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "Fraunces, serif" }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children, C }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium mb-1.5" style={{ color: C.textMuted }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = (C) => ({ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, width: "100%", padding: "10px 12px", borderRadius: "10px", fontSize: "14px", outline: "none" });

function CalculatorPopover({ C, initial, onApply, onClose }) {
  const [display, setDisplay] = useState(initial && initial !== "0" ? initial : "0");
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [resetNext, setResetNext] = useState(false);

  const compute = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? a : a / b;
      default: return b;
    }
  };

  const pressDigit = (d) => {
    if (resetNext) { setDisplay(d); setResetNext(false); return; }
    setDisplay((prev) => (prev === "0" ? d : prev.length < 15 ? prev + d : prev));
  };

  const pressOp = (nextOp) => {
    const current = Number(display);
    if (acc !== null && op && !resetNext) {
      const result = compute(acc, current, op);
      setAcc(result);
      setDisplay(String(result));
    } else {
      setAcc(current);
    }
    setOp(nextOp);
    setResetNext(true);
  };

  const pressEquals = () => {
    if (acc === null || !op) return;
    const result = compute(acc, Number(display), op);
    setDisplay(String(result));
    setAcc(null);
    setOp(null);
    setResetNext(true);
  };

  const pressClear = () => { setDisplay("0"); setAcc(null); setOp(null); setResetNext(false); };
  const pressBackspace = () => setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));

  const applyResult = () => {
    const finalValue = acc !== null && op ? compute(acc, Number(display), op) : Number(display);
    onApply(Math.max(0, Math.round(finalValue)));
  };

  const formatted = display ? Number(display).toLocaleString("id-ID") : "0";
  const BTN = "py-3 rounded-xl text-base font-medium transition-transform duration-100 active:scale-95";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ fontFamily: "Fraunces, serif", color: C.text }}>Kalkulator</span>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={18} /></button>
        </div>
        <div className="rounded-xl px-4 py-4 mb-3 text-right" style={{ background: C.surface2 }}>
          {op && <div className="text-xs mb-1" style={{ color: C.textMuted }}>{Number(acc).toLocaleString("id-ID")} {op}</div>}
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 24, fontWeight: 600, color: C.text }}>Rp {formatted}</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button onClick={pressClear} className={BTN} style={{ background: C.coralSoft, color: C.coral }}>C</button>
          <button onClick={pressBackspace} className={BTN} style={{ background: C.surface2, color: C.textMuted }}><Delete size={16} className="mx-auto" /></button>
          <button onClick={() => pressOp("÷")} className={BTN} style={{ background: op === "÷" ? C.jade : C.surface2, color: op === "÷" ? "#08130F" : C.jade }}>÷</button>
          <button onClick={() => pressOp("×")} className={BTN} style={{ background: op === "×" ? C.jade : C.surface2, color: op === "×" ? "#08130F" : C.jade }}>×</button>
          {["7", "8", "9"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={BTN} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={() => pressOp("-")} className={BTN} style={{ background: op === "-" ? C.jade : C.surface2, color: op === "-" ? "#08130F" : C.jade }}>-</button>
          {["4", "5", "6"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={BTN} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={() => pressOp("+")} className={BTN} style={{ background: op === "+" ? C.jade : C.surface2, color: op === "+" ? "#08130F" : C.jade }}>+</button>
          {["1", "2", "3"].map((d) => <button key={d} onClick={() => pressDigit(d)} className={BTN} style={{ background: C.surface2, color: C.text }}>{d}</button>)}
          <button onClick={pressEquals} className="row-span-2 rounded-xl text-base font-semibold transition-transform duration-100 active:scale-95" style={{ background: C.jade, color: "#08130F" }}>=</button>
          <button onClick={() => pressDigit("0")} className={`${BTN} col-span-2`} style={{ background: C.surface2, color: C.text }}>0</button>
          <button onClick={() => pressDigit("000")} className={BTN} style={{ background: C.surface2, color: C.text }}>000</button>
        </div>
        <button onClick={applyResult} className="w-full py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>
          Gunakan Nominal Ini
        </button>
      </div>
    </div>,
    document.body
  );
}

function AmountInput({ value, onChange, C, placeholder = "0" }) {
  const [showCalc, setShowCalc] = useState(false);
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  const formatted = digits ? Number(digits).toLocaleString("id-ID") : "";
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: C.textMuted }}>Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        style={{ ...inputStyle(C), paddingLeft: 34, paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setShowCalc(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-transform duration-150 hover:scale-105 active:scale-95"
        style={{ color: C.jade, background: C.jadeSoft }}
        title="Buka kalkulator"
      >
        <Calculator size={15} />
      </button>
      {showCalc && (
        <CalculatorPopover
          C={C}
          initial={digits || "0"}
          onApply={(result) => { onChange(String(result)); setShowCalc(false); }}
          onClose={() => setShowCalc(false)}
        />
      )}
    </div>
  );
}

const ACCOUNTS = [
  { username: "admin", password: "admin313", role: "admin", displayName: "Admin" },
  { username: "Risyad", password: "313500", role: "staff", displayName: "Risyad" },
  { username: "Damah", password: "313500", role: "staff", displayName: "Damah" },
  { username: "Nasir", password: "313500", role: "staff", displayName: "Nasir" },
];

function QuickPaymentModal({ open, onClose, C, title, itemName, remaining, confirmLabel = "Simpan", onConfirm }) {
  const [amount, setAmount] = useState("");
  useEffect(() => { if (open) setAmount(""); }, [open]);
  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    onConfirm(amt);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={title} C={C}>
      {itemName && (
        <div className="mb-4 px-3 py-2.5 rounded-lg" style={{ background: C.surface2 }}>
          <div className="text-sm font-medium" style={{ color: C.text }}>{itemName}</div>
          {remaining != null && <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>Sisa: {fmtIDR(remaining)}</div>}
        </div>
      )}
      <Field label="Jumlah (Rp)" C={C}>
        <AmountInput value={amount} onChange={setAmount} C={C} />
      </Field>
      <button
        onClick={submit}
        disabled={!Number(amount)}
        className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95"
        style={{ background: Number(amount) ? C.jade : C.surface2, color: Number(amount) ? "#08130F" : C.textMuted }}
      >
        {confirmLabel}
      </button>
    </Modal>
  );
}

function LoginScreen({ C, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const acc = ACCOUNTS.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
    );
    if (!acc) {
      setError("Username atau password salah.");
      return;
    }
    setError("");
    onLogin({ name: acc.displayName, role: acc.role });
  };
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "Inter, sans-serif" }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl p-7 relative overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <ContourLines color={C.jade} opacity={0.12} />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.jade}, ${C.blue})` }}>
              <Landmark size={19} color="#08130F" />
            </div>
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, color: C.text }}>Lombok Bali</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Keuangan Kawasan</div>
            </div>
          </div>
          <div className="text-sm mb-5" style={{ color: C.textMuted }}>Masuk untuk mengakses sistem keuangan.</div>
          <Field label="Username" C={C}>
            <input value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="Username" style={inputStyle(C)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <Field label="Password" C={C}>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Password" style={inputStyle(C)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          {error && (
            <div className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: C.coralSoft, color: C.coral }}>{error}</div>
          )}
          <button onClick={submit} disabled={!username.trim() || !password} className="w-full py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2" style={{ background: username.trim() && password ? C.jade : C.surface2, color: username.trim() && password ? "#08130F" : C.textMuted }}>
            <Lock size={15} /> Masuk
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [tab, setTab] = useState("dashboard");
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
  const [mobileNav, setMobileNav] = useState(false);

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
    const unsubscribe = subscribeAppData((data) => {
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
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
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

  const FALLBACK_CATEGORY = { id: "unknown", label: "Lainnya", icon: Tag, color: "#9CB0A6" };
  const getCat = (id) => categories.find((c) => c.id === id) || categories[categories.length - 1] || FALLBACK_CATEGORY;
  const getProject = (id) => projects.find((p) => p.id === id);

  const scopedTx = useMemo(
    () => (activeProject === "all" ? transactions : transactions.filter((t) => t.projectId === activeProject)),
    [transactions, activeProject]
  );

  // Totals dengan breakdown modal vs keuntungan
  const totals = useMemo(() => {
    let income = 0, expense = 0, modal = 0, profit = 0;
    scopedTx.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
        const s = splitIncome(t, getProject(t.projectId));
        if (s) { modal += s.modal; profit += s.profit; }
      } else {
        expense += t.amount;
      }
    });
    return { income, expense, balance: income - expense, modal, profit };
  }, [scopedTx, projects]);

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = useMemo(
    () => scopedTx.filter((t) => t.type === "expense" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0),
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
    transactions
      .filter((t) => activeProject === "all" || t.projectId === activeProject)
      .forEach((t) => {
        const k = monthKey(t.date);
        if (!map[k]) map[k] = { month: k, Pemasukan: 0, Pengeluaran: 0, Modal: 0, Keuntungan: 0 };
        if (t.type === "income") {
          map[k].Pemasukan += t.amount;
          const s = splitIncome(t, getProject(t.projectId));
          if (s) { map[k].Modal += s.modal; map[k].Keuntungan += s.profit; }
        } else {
          map[k].Pengeluaran += t.amount;
        }
      });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((r) => ({ ...r, label: monthLabel(r.month) }));
  }, [transactions, activeProject, projects]);

  const projectComparison = useMemo(
    () => projects.map((p) => {
      const exp = transactions.filter((t) => t.projectId === p.id && t.type === "expense" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0);
      return { name: p.name.split(" ")[0], Anggaran: p.budget, Terpakai: exp };
    }), [projects, transactions, thisMonthKey]
  );

  const upcomingBills = useMemo(() => bills.filter((b) => activeProject === "all" || b.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [bills, activeProject]);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "Kawasan (Semua Projek)";
  const projectColor = (id) => projects.find((p) => p.id === id)?.color || C.jade;
  const isAdmin = user?.role === "admin";

  if (!userLoaded) return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!user) return <LoginScreen C={C} onLogin={handleLogin} />;

  const NAV = [
    { id: "dashboard", label: "Dasbor", icon: LayoutDashboard },
    { id: "projects", label: "PROJEK", icon: Building2 },
    { id: "keuangan", label: "Keuangan", icon: Wallet },
    { id: "people", label: "Ahli", icon: Users2 },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "Inter, sans-serif", minHeight: "100vh", transition: "background .3s ease, color .3s ease" }}>
      <style>{`@keyframes lbFadeIn { from{opacity:0} to{opacity:1} } @keyframes lbSlideUp { from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} } @keyframes lbFadeUp { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} } .lb-anim { animation: lbFadeUp .35s cubic-bezier(.2,.8,.2,1) both; } .lb-row:hover { background: ${C.surface2} !important; } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; } * { scrollbar-color: ${C.border} transparent; }`}</style>
      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 px-4 py-6" style={{ background: C.bgSoft, borderRight: `1px solid ${C.border}` }}>
          <Brand C={C} />
          <ProjectSwitcher {...{ projects, activeProject, setActiveProject, C }} />
          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((n) => <NavItem key={n.id} n={n} active={tab === n.id} onClick={() => setTab(n.id)} C={C} />)}
          </nav>
          <SyncFooter syncState={syncState} isDark={isDark} setIsDark={setIsDark} C={C} user={user} onLogout={handleLogout} />
        </aside>
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <IconBtn C={C} onClick={() => setMobileNav(true)}><Menu size={16} /></IconBtn>
            <Brand C={C} compact />
          </div>
          <IconBtn C={C} onClick={() => setIsDark((d) => !d)}>{isDark ? <Sun size={16} /> : <Moon size={16} />}</IconBtn>
        </div>
        <div className="md:hidden fixed inset-0 z-50" style={{ pointerEvents: mobileNav ? "auto" : "none" }} aria-hidden={!mobileNav}>
          <div onClick={() => setMobileNav(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", opacity: mobileNav ? 1 : 0, transition: "opacity .25s ease" }} />
          <div className="absolute top-0 left-0 h-full w-72 max-w-[82vw] px-4 py-5 flex flex-col overflow-y-auto" style={{ background: C.bgSoft, borderRight: `1px solid ${C.border}`, transform: mobileNav ? "translateX(0)" : "translateX(-100%)", transition: "transform .28s cubic-bezier(.2,.8,.2,1)" }}>
            <div className="flex items-center justify-between mb-2">
              <Brand C={C} />
              <button onClick={() => setMobileNav(false)} style={{ color: C.textMuted }}><X size={20} /></button>
            </div>
            <ProjectSwitcher {...{ projects, activeProject, setActiveProject: (v) => { setActiveProject(v); setMobileNav(false); }, C }} />
            <nav className="mt-6 flex-1 space-y-1">
              {NAV.map((n) => <NavItem key={n.id} n={n} active={tab === n.id} onClick={() => { setTab(n.id); setMobileNav(false); }} C={C} />)}
            </nav>
            <SyncFooter syncState={syncState} isDark={isDark} setIsDark={setIsDark} C={C} user={user} onLogout={handleLogout} />
          </div>
        </div>
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 md:py-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
          {tab === "dashboard" && <Dashboard {...{ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people, getCat, getProject }} />}
          {tab === "projects" && <ProjectsView {...{ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin, getProject }} />}
          {tab === "keuangan" && <KeuanganView {...{ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin, categories, getCat, onManageCat: () => setCatModal(true), thisMonthKey, goals, setGoals, setGoalModal, bills, setBills, setBillModal, debts, setDebts, setDebtModal, categoryBreakdown, monthlyTrend, projectComparison, totals, getProject }} />}
          {tab === "people" && <PeopleView {...{ C, people, setPeople, projects, projectName, setPersonModal, isAdmin, activeProject }} />}
        </main>
      </div>
      <button onClick={() => setTxModal("new")} className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: C.jade, color: "#08130F", fontWeight: 600, boxShadow: `0 8px 24px ${C.jadeSoft}` }}>
        <Plus size={18} /> <span className="hidden sm:inline">Transaksi</span>
      </button>
      <AddTransactionModal
        open={!!txModal} editing={txModal && txModal !== "new" ? txModal : null} onClose={() => setTxModal(null)}
        C={C} projects={projects} goals={goals} debts={debts} categories={categories}
        onAddTransaction={(t) => setTransactions((prev) => [{ id: uid("t"), ...t }, ...prev])}
        onEditTransaction={(id, data) => setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))}
        onContributeGoal={(goalId, amt) => setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, current: g.current + amt } : g)))}
        onPayDebt={(debtId, amt) => setDebts((prev) => prev.map((d) => (d.id === debtId ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)))}
      />
      <ManageCategoriesModal open={catModal} onClose={() => setCatModal(false)} C={C} categories={categories} setCategories={setCategories} />
      <AddGoalModal open={!!goalModal} editing={goalModal && goalModal !== "new" ? goalModal : null} onClose={() => setGoalModal(null)} C={C} projects={projects} onSave={(data) => { if (data.id) setGoals((prev) => prev.map((g) => (g.id === data.id ? { ...g, ...data } : g))); else setGoals((prev) => [{ id: uid("g"), current: 0, ...data }, ...prev]); }} />
      <AddBillModal open={!!billModal} editing={billModal && billModal !== "new" ? billModal : null} onClose={() => setBillModal(null)} C={C} projects={projects} categories={categories} onSave={(data) => { if (data.id) setBills((prev) => prev.map((b) => (b.id === data.id ? { ...b, ...data } : b))); else setBills((prev) => [{ id: uid("b"), paidAmount: 0, ...data }, ...prev]); }} />
      <AddDebtModal open={!!debtModal} editing={debtModal && debtModal !== "new" ? debtModal : null} onClose={() => setDebtModal(null)} C={C} projects={projects} onSave={(data) => { if (data.id) setDebts((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))); else setDebts((prev) => [{ id: uid("d"), paidAmount: 0, ...data }, ...prev]); }} />
      <AddPersonModal open={!!personModal} editing={personModal && personModal !== "new" ? personModal : null} onClose={() => setPersonModal(null)} C={C} projects={projects} onSave={(data) => { if (data.id) setPeople((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))); else setPeople((prev) => [{ id: uid("ah"), ...data }, ...prev]); }} />
      <AddProjectModal open={!!projModal} editing={projModal && projModal !== "new" ? projModal : null} onClose={() => setProjModal(null)} C={C} onSave={(data) => { if (data.id) setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))); else setProjects((prev) => [...prev, { id: uid("p"), color: PROJECT_COLORS[prev.length % PROJECT_COLORS.length], modalPercent: DEFAULT_MODAL_PERCENT, ...data }]); }} />
    </div>
  );
}

function Brand({ C, compact }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${C.jade}, ${C.blue})` }}>
        <Landmark size={18} color="#08130F" />
      </div>
      {!compact && (
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, lineHeight: 1, color: C.text }}>Lombok Bali</div>
          <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 0.3 }}>Keuangan Kawasan</div>
        </div>
      )}
      {compact && <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Lombok Bali</div>}
    </div>
  );
}

function ProjectSwitcher({ projects, activeProject, setActiveProject, C }) {
  return (
    <div className="mt-6">
      <div className="text-xs font-medium mb-2 px-1" style={{ color: C.textMuted }}>KAWASAN</div>
      <button onClick={() => setActiveProject("all")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-sm transition-all duration-150" style={{ background: activeProject === "all" ? C.jadeSoft : "transparent", color: activeProject === "all" ? C.jade : C.textMuted, fontWeight: activeProject === "all" ? 600 : 500 }}>
        <Sparkles size={15} /> Semua Projek
      </button>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {projects.length === 0 && <div className="px-3 text-xs" style={{ color: C.textMuted }}>Belum ada projek</div>}
        {projects.map((p) => (
          <button key={p.id} onClick={() => setActiveProject(p.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150" style={{ background: activeProject === p.id ? C.surface2 : "transparent", color: activeProject === p.id ? C.text : C.textMuted, fontWeight: activeProject === p.id ? 600 : 500 }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="truncate text-left">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NavItem({ n, active, onClick, C }) {
  const Icon = n.icon;
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150" style={{ background: active ? C.surface2 : "transparent", color: active ? C.jade : C.textMuted, fontWeight: active ? 600 : 500 }}>
      <Icon size={17} /> {n.label}
    </button>
  );
}

function SyncFooter({ syncState, isDark, setIsDark, C, user, onLogout }) {
  const RoleIcon = user?.role === "admin" ? ShieldCheck : UserCog;
  return (
    <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${C.border}` }}>
      {user && (
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}>
            <RoleIcon size={14} color={C.jade} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate" style={{ color: C.text }}>{user.name}</div>
            <div className="text-xs capitalize" style={{ color: C.textMuted }}>{user.role === "admin" ? "Admin" : "Staff"}</div>
          </div>
          <button onClick={onLogout} title="Keluar" className="p-1.5 rounded-md transition-transform duration-150 hover:scale-110" style={{ color: C.textMuted }}><LogOut size={15} /></button>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
          {syncState === "saving" ? <Cloud size={14} className="animate-pulse" /> : <Cloud size={14} style={{ color: C.jade }} />}
          {syncState === "saving" ? "Menyimpan data…" : "Data tersimpan"}
        </div>
      </div>
      <button onClick={() => setIsDark((d) => !d)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200" style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}>
        {isDark ? <Sun size={15} /> : <Moon size={15} />} {isDark ? "Mode Terang" : "Mode Gelap"}
      </button>
    </div>
  );
}

function Dashboard({ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people, getCat, getProject }) {
  const budgetPct = monthBudget ? (monthSpend / monthBudget) * 100 : 0;
  const recent = scopedTx.slice(0, 5);
  const dueSoon = upcomingBills.filter((b) => b.paidAmount < b.amount).slice(0, 4);
  const upcomingBirthdays = (people || [])
    .map((p) => ({ person: p, bday: daysUntilBirthday(p.birthDate) }))
    .filter((x) => x.bday && x.bday.days <= 30)
    .sort((a, b) => a.bday.days - b.bday.days)
    .slice(0, 5);

  // Data untuk chart Modal vs Keuntungan
  const modalVsProfitData = useMemo(() => {
    if (totals.income === 0) return [];
    return [
      { name: "Modal", value: totals.modal, color: C.blue },
      { name: "Keuntungan", value: totals.profit, color: C.jade },
    ];
  }, [totals, C]);

  return (
    <div className="space-y-6 lb-anim">
      {people && people.length > 0 && (
        <Card C={C} pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Data Ahli</h3>
            <button onClick={() => setTab("people")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="grid grid-cols-3 gap-4 px-5 pb-5">
            {[{ key: "staff-l", label: "Staff L", icon: User }, { key: "staff-p", label: "Staff P", icon: User }, { key: "anak", label: "Anak", icon: Baby }].map((g) => {
              const Icon = g.icon; const count = people.filter((p) => p.category === g.key).length;
              return (
                <div key={g.key} className="rounded-xl p-3.5" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                  <Icon size={16} color={C.jade} />
                  <div className="text-xl font-bold mt-2" style={{ fontFamily: "Fraunces, serif", color: C.text }}>{count}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{g.label}</div>
                </div>
              );
            })}
          </div>
          {upcomingBirthdays.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium" style={{ color: C.gold }}><Cake size={13} /> Ulang Tahun Segera</div>
              <div className="space-y-1.5">
                {upcomingBirthdays.map(({ person, bday }) => (
                  <div key={person.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: C.goldSoft }}>
                    <span className="text-sm" style={{ color: C.text }}>{person.name}</span>
                    <span className="text-xs font-medium" style={{ color: C.gold }}>{bday.days === 0 ? "Hari ini! 🎉" : `${bday.days} hari lagi`} · ke-{bday.nextAge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
      <div className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-9" style={{ background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`, border: `1px solid ${C.border}` }}>
        <ContourLines color={C.jade} opacity={isDark ? 0.16 : 0.09} />
        <div className="relative">
          <div className="text-xs font-medium tracking-wide mb-2" style={{ color: C.textMuted }}>
            {activeProject === "all" ? "SELURUH KAWASAN" : projectName(activeProject).toUpperCase()}
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>Saldo Bersih</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 32, fontWeight: 600, color: totals.balance >= 0 ? C.jade : C.coral }}>{fmtIDR(totals.balance)}</div>
            </div>
            <div className="flex gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowUpRight size={14} color={C.jade} /> Pemasukan</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600, color: C.text }}>{fmtIDR(totals.income)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowDownRight size={14} color={C.coral} /> Pengeluaran</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600, color: C.text }}>{fmtIDR(totals.expense)}</div>
              </div>
            </div>
          </div>
          {totals.income > 0 && (
            <div className="mt-5 pt-5 grid grid-cols-2 gap-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: C.blue, fontSize: 12, fontWeight: 500 }}>
                  <Coins size={13} /> Porsi Modal
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 600, color: C.text }}>{fmtIDR(totals.modal)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                  {totals.income ? ((totals.modal / totals.income) * 100).toFixed(1) : 0}% dari pemasukan
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: C.jade, fontSize: 12, fontWeight: 500 }}>
                  <TrendingUp size={13} /> Porsi Keuntungan
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 600, color: C.text }}>{fmtIDR(totals.profit)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                  {totals.income ? ((totals.profit / totals.income) * 100).toFixed(1) : 0}% dari pemasukan
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Projek Aktif</span><Building2 size={16} color={C.jade} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif", color: C.text }}>{projects.length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Anggaran Bulan Ini</span><Wallet size={16} color={C.gold} /></div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: C.text }}>{fmtIDR(monthBudget)}</div>
          <div className="mt-2"><ProgressBar pct={budgetPct} color={budgetPct > 90 ? C.coral : C.jade} C={C} /></div>
          <div className="text-xs mt-1" style={{ color: C.textMuted }}>{budgetPct.toFixed(0)}% terpakai</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Tagihan Menunggu</span><Bell size={16} color={C.coral} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif", color: C.text }}>{upcomingBills.filter((b) => b.paidAmount < b.amount).length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Transaksi</span><Receipt size={16} color={C.blue} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif", color: C.text }}>{scopedTx.length}</div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Card C={C} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Tren Bulanan</h3>
            <Badge C={C} tone="jade"><TrendingUp size={12} /> 6 bulan</Badge>
          </div>
          {monthlyTrend.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textMuted }}>Belum ada data tren</div> :
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" stroke={C.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textMuted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} />
                <Line type="monotone" dataKey="Pemasukan" stroke={C.jade} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Pengeluaran" stroke={C.coral} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          }
        </Card>
        <Card C={C} className="lg:col-span-2">
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Pembagian Pemasukan</h3>
          {modalVsProfitData.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textMuted }}>Belum ada pemasukan</div> :
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={modalVsProfitData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                    {modalVsProfitData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {modalVsProfitData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text }}>{fmtIDR(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          }
        </Card>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Card C={C} className="lg:col-span-3">
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Pengeluaran per Kategori</h3>
          {categoryBreakdown.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textMuted }}>Belum ada data</div> :
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={45} outerRadius={68} paddingAngle={3}>
                    {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryBreakdown.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text }}>{fmtIDR(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          }
        </Card>
        <Card C={C} className="lg:col-span-2" pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Tagihan Mendatang</h3>
            <button onClick={() => setTab("keuangan")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="pb-3">
            {dueSoon.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textMuted }}>Semua tagihan aman 🎉</div>}
            {dueSoon.map((b) => {
              const overdue = new Date(b.dueDate) < new Date(new Date().toDateString());
              return (
                <div key={b.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: overdue ? C.coralSoft : C.goldSoft }}>
                    {overdue ? <AlertTriangle size={15} color={C.coral} /> : <Clock size={15} color={C.gold} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: C.text }}>{b.name}</div>
                    <div className="text-xs" style={{ color: overdue ? C.coral : C.textMuted }}>{projectName(b.projectId)} · {fmtDate(b.dueDate)}</div>
                  </div>
                  <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: C.text }}>{fmtIDR(b.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card C={C} pad="p-0">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Transaksi Terbaru</h3>
          <button onClick={() => setTab("keuangan")} className="text-xs font-medium" style={{ color: C.jade }}>Lihat semua</button>
        </div>
        <div>
          {recent.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textMuted }}>Belum ada transaksi.</div>}
          {recent.map((t) => {
            const cat = getCat(t.category);
            const Icon = isValidIcon(cat.icon) ? cat.icon : Tag;
            const split = t.type === "income" ? splitIncome(t, getProject(t.projectId)) : null;
            return (
              <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                  {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: C.text }}>{t.note}</div>
                  <div className="text-xs" style={{ color: C.textMuted }}>
                    {projectName(t.projectId)} · {fmtDate(t.date)}
                    {split && (
                      <span className="ml-2" style={{ color: C.textMuted }}>
                        · <span style={{ color: C.blue }}>M: {fmtIDR(split.modal)}</span> · <span style={{ color: C.jade }}>K: {fmtIDR(split.profit)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                  {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function KeuanganView(props) {
  const { C } = props;
  const [subTab, setSubTab] = useState("transactions");
  const SUBTABS = [
    { id: "transactions", label: "Transaksi", icon: Receipt },
    { id: "budget", label: "Anggaran", icon: Wallet },
    { id: "savings", label: "Tabungan", icon: PiggyBank },
    { id: "bills", label: "Tagihan", icon: Bell },
    { id: "debts", label: "Hutang", icon: HandCoins },
    { id: "analytics", label: "Analitik", icon: BarChart3 },
  ];
  return (
    <div className="space-y-5 lb-anim">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SUBTABS.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150"
              style={{ background: active ? C.jadeSoft : C.surface2, color: active ? C.jade : C.textMuted, border: `1px solid ${active ? C.jade : C.border}` }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
      {subTab === "transactions" && <TransactionsView {...props} />}
      {subTab === "budget" && <BudgetView {...props} />}
      {subTab === "savings" && <SavingsView {...props} />}
      {subTab === "bills" && <BillsView {...props} />}
      {subTab === "debts" && <DebtsView {...props} />}
      {subTab === "analytics" && <AnalyticsView {...props} />}
    </div>
  );
}

function ProjectsView({ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin, getProject }) {
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Profil Projek" subtitle="Semua kawasan pengembangan yang sedang berjalan" action={isAdmin ? { label: "Tambah Projek", onClick: () => setProjModal("new") } : null} />
      {isAdmin && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs" style={{ background: C.jadeSoft, border: `1px solid ${C.border}` }}>
          <Split size={14} color={C.jade} className="shrink-0 mt-0.5" />
          <span style={{ color: C.textMuted, lineHeight: 1.5 }}>
            <strong style={{ color: C.jade }}>Pembagian otomatis:</strong> Setiap pemasukan akan otomatis dipisah menjadi <strong style={{ color: C.blue }}>Modal</strong> dan <strong style={{ color: C.jade }}>Keuntungan</strong> sesuai persentase yang diatur di setiap projek (default {DEFAULT_MODAL_PERCENT}% modal). Klik <Pencil size={10} style={{ display: "inline", verticalAlign: "middle" }} /> di kartu projek untuk mengubah persentase.
          </span>
        </div>
      )}
      {projects.length === 0 && <div className="text-sm" style={{ color: C.textMuted }}>Belum ada data projek. Klik tombol tambah projek untuk mulai.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const tx = transactions.filter((t) => t.projectId === p.id);
          const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          let totalModal = 0, totalProfit = 0;
          tx.filter((t) => t.type === "income").forEach((t) => {
            const s = splitIncome(t, p);
            if (s) { totalModal += s.modal; totalProfit += s.profit; }
          });
          const totalIncome = totalModal + totalProfit;
          const balance = totalIncome - spent;
          const pct = p.modalPercent ?? DEFAULT_MODAL_PERCENT;

          return (
            <Card key={p.id} C={C} pad="p-0" className="overflow-hidden group transition-transform duration-200 hover:-translate-y-1" style={{ position: "relative" }}>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); setProjModal(p); }} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-transform duration-150 hover:scale-110" style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }} title="Edit projek"><Pencil size={13} /></button>
              )}
              <div onClick={() => { setActiveProject(p.id); setTab("dashboard"); }} className="cursor-pointer">
                <div className="relative h-20 flex items-end p-4" style={{ background: `linear-gradient(135deg, ${p.color}30, ${p.color}08)` }}>
                  <ContourLines color={p.color} opacity={0.3} />
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.color }}><Building2 size={18} color="#08130F" /></div>
                </div>
                <div className="p-4">
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: C.text }}>{p.name}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5 mb-3" style={{ color: C.textMuted }}>
                    <MapPin size={11} />{p.location}
                    <span className="ml-auto flex items-center gap-1" style={{ color: C.blue }}>
                      <Split size={10} /> {pct}% modal
                    </span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: C.textMuted, lineHeight: 1.5 }}>{p.desc}</p>

                  {/* Pemasukan terpisah: Modal & Keuntungan */}
                  <div className="mb-3 p-3 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.borderSoft}` }}>
                    <div className="text-[11px] font-medium tracking-wide mb-2 flex items-center gap-1" style={{ color: C.textMuted }}>
                      <ArrowUpRight size={11} color={C.jade} /> PEMASUKAN TERPISAH
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: C.blue }}>
                          <Coins size={10} /> Modal
                        </div>
                        <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(totalModal)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: C.jade }}>
                          <TrendingUp size={10} /> Keuntungan
                        </div>
                        <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(totalProfit)}</div>
                      </div>
                    </div>
                    {totalIncome > 0 && (
                      <div className="mt-2 flex h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                        <div style={{ width: `${(totalModal / totalIncome) * 100}%`, background: C.blue, transition: "width .5s" }} />
                        <div style={{ width: `${(totalProfit / totalIncome) * 100}%`, background: C.jade, transition: "width .5s" }} />
                      </div>
                    )}
                  </div>

                  <div className="text-xs mb-3">
                    <div style={{ color: C.textMuted }}>Pengeluaran</div>
                    <div className="font-semibold" style={{ color: C.coral, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <span style={{ color: C.textMuted }}>Saldo</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: balance >= 0 ? C.jade : C.coral }}>{fmtIDR(balance)}</span>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textMuted }}>
                    <span>PJ: {p.manager}</span>
                    <span>{fmtIDR(p.budget)}/bln</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TransactionsView({ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin, categories, getCat, onManageCat, getProject }) {
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const rows = useMemo(() => {
    return transactions
      .filter((t) => activeProject === "all" || t.projectId === activeProject)
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) => t.note.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, activeProject, filterType, q]);

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Riwayat Transaksi" subtitle="Seluruh catatan pemasukan dan pengeluaran" action={{ label: "Tambah Transaksi", onClick: () => setTxModal("new") }} />
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          {["all", "income", "expense"].map((f) => (
            <button key={f} onClick={() => setFilterType(f)} className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex-1 sm:flex-none" style={{ background: filterType === f ? C.jadeSoft : C.surface2, color: filterType === f ? C.jade : C.textMuted, border: `1px solid ${C.border}` }}>
              {f === "all" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.textMuted} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." style={{ ...inputStyle(C), paddingLeft: 34 }} />
          </div>
          <button onClick={onManageCat} className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}>
            <Tag size={15} /> <span className="hidden sm:inline">Kategori</span>
          </button>
        </div>
      </div>
      <Card C={C} pad="p-0">
        {rows.length === 0 && <div className="p-8 text-center text-sm" style={{ color: C.textMuted }}>Tidak ada transaksi ditemukan.</div>}
        {rows.map((t, i) => {
          const cat = getCat(t.category);
          const Icon = isValidIcon(cat.icon) ? cat.icon : Tag;
          const split = t.type === "income" ? splitIncome(t, getProject(t.projectId)) : null;
          return (
            <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.borderSoft}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: C.text }}>{t.note}</div>
                <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: C.textMuted }}>
                  <span style={{ color: projectColor(t.projectId) }}>●</span>
                  <span>{projectName(t.projectId)}</span>
                  <span>·</span>
                  <span>{fmtDate(t.date)}</span>
                  <span>·</span>
                  <span>{t.type === "expense" ? cat.label : "Pemasukan"}</span>
                  {split && (
                    <>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `${C.blue}22`, color: C.blue }}>
                        M {fmtIDR(split.modal)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: C.jadeSoft, color: C.jade }}>
                        K {fmtIDR(split.profit)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setTxModal(t)} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textMuted }} title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textMuted }} title="Hapus"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function BudgetView({ C, projects, transactions, thisMonthKey, categories, activeProject }) {
  const shownProjects = activeProject === "all" ? projects : projects.filter((p) => p.id === activeProject);
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Anggaran Bulanan" subtitle={`Realisasi vs anggaran untuk ${monthLabel(thisMonthKey)}`} />
      {shownProjects.length === 0 && <div className="text-sm" style={{ color: C.textMuted }}>Belum ada data projek.</div>}
      <div className="grid lg:grid-cols-2 gap-5">
        {shownProjects.map((p) => {
          const tx = transactions.filter((t) => t.projectId === p.id && t.type === "expense" && monthKey(t.date) === thisMonthKey);
          const spent = tx.reduce((s, t) => s + t.amount, 0);
          const pct = p.budget ? (spent / p.budget) * 100 : 0;
          const byCat = {};
          tx.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
          const catRows = categories.map((c) => ({ ...c, value: byCat[c.id] || 0 })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
          return (
            <Card key={p.id} C={C}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: C.text }}>{p.name}</span>
                </div>
                <Badge C={C} tone={pct > 90 ? "coral" : pct > 70 ? "gold" : "jade"}>{pct.toFixed(0)}%</Badge>
              </div>
              <div className="flex items-baseline justify-between text-sm mb-2" style={{ color: C.textMuted }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</span><span>dari {fmtIDR(p.budget)}</span>
              </div>
              <ProgressBar pct={pct} color={pct > 90 ? C.coral : pct > 70 ? C.gold : C.jade} C={C} height={10} />
              <div className="mt-4 space-y-2.5">
                {catRows.length === 0 && <div className="text-xs" style={{ color: C.textMuted }}>Belum ada pengeluaran bulan ini.</div>}
                {catRows.map((c) => {
                  const Icon = isValidIcon(c.icon) ? c.icon : Tag;
                  const catPct = p.budget ? (c.value / p.budget) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><Icon size={12} color={c.color} />{c.label}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text }}>{fmtIDR(c.value)}</span>
                      </div>
                      <ProgressBar pct={catPct} color={c.color} C={C} height={6} />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SavingsView({ C, goals, setGoals, projects, projectName, setGoalModal, isAdmin, activeProject, setTransactions }) {
  const shownGoals = activeProject === "all" ? goals : goals.filter((g) => g.projectId === activeProject || g.projectId === "all");
  const [payGoal, setPayGoal] = useState(null);
  const confirmAddFunds = (n) => {
    const goal = payGoal;
    if (!goal) return;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current: g.current + n } : g)));
    const projId = goal.projectId === "all" ? (projects[0]?.id || "") : goal.projectId;
    if (projId) {
      setTransactions((prev) => [{ id: uid("t"), type: "expense", projectId: projId, category: "tabungan", amount: n, date: new Date().toISOString().slice(0, 10), note: `Setor ke tabungan: ${goal.name}` }, ...prev]);
    }
  };
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Target Tabungan" subtitle="Rencana dana jangka panjang kawasan" action={isAdmin ? { label: "Tambah Target", onClick: () => setGoalModal("new") } : null} />
      {shownGoals.length === 0 && <div className="text-sm" style={{ color: C.textMuted }}>Belum ada data tabungan.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {shownGoals.map((g) => {
          const pct = g.target ? (g.current / g.target) * 100 : 0;
          const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
          return (
            <Card key={g.id} C={C} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: C.text }}>{g.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(g.projectId === "all" ? undefined : g.projectId) || "Seluruh Kawasan"}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setGoalModal(g)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  {isAdmin && <button onClick={() => { if (confirm(`Hapus target "${g.name}"?`)) setGoals((prev) => prev.filter((x) => x.id !== g.id)); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.coralSoft, color: C.coral }} title="Hapus"><Trash2 size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}><PiggyBank size={17} color={C.jade} /></div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: C.text }}>{fmtIDR(g.current)}</span> <span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(g.target)}</span>
              </div>
              <ProgressBar pct={pct} color={C.jade} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textMuted }}>
                <span>{pct.toFixed(0)}% tercapai</span> <span className="flex items-center gap-1"><Calendar size={11} />{daysLeft > 0 ? `${daysLeft} hari lagi` : "Jatuh tempo"}</span>
              </div>
              <button onClick={() => setPayGoal(g)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.jade, border: `1px solid ${C.border}` }}>
                <PlusCircle size={14} /> Tambah Dana
              </button>
            </Card>
          );
        })}
      </div>
      <QuickPaymentModal
        open={!!payGoal}
        onClose={() => setPayGoal(null)}
        C={C}
        title="Tambah Dana Tabungan"
        itemName={payGoal?.name}
        remaining={payGoal ? Math.max(0, payGoal.target - payGoal.current) : null}
        confirmLabel="Tambah Dana"
        onConfirm={confirmAddFunds}
      />
    </div>
  );
}

function BillsView({ C, bills, setBills, projects, projectName, setBillModal, isAdmin, getCat, activeProject, setTransactions }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...bills].filter((b) => activeProject === "all" || b.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const [payBill, setPayBill] = useState(null);
  const confirmAddPayment = (amt) => {
    const bill = payBill;
    if (!bill) return;
    setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, paidAmount: Math.min(b.amount, b.paidAmount + amt) } : b)));
    setTransactions((prev) => [{ id: uid("t"), type: "expense", projectId: bill.projectId, category: bill.category || "belanja", amount: amt, date: new Date().toISOString().slice(0, 10), note: `Bayar tagihan: ${bill.name}` }, ...prev]);
  };
  const markFullyPaid = (id) => {
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;
    const remaining = Math.max(0, bill.amount - bill.paidAmount);
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidAmount: b.amount } : b)));
    if (remaining > 0) {
      setTransactions((prev) => [{ id: uid("t"), type: "expense", projectId: bill.projectId, category: bill.category || "belanja", amount: remaining, date: new Date().toISOString().slice(0, 10), note: `Pelunasan tagihan: ${bill.name}` }, ...prev]);
    }
  };
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Pengingat Tagihan" subtitle="Lacak progres pembayaran hingga tagihan lunas" action={isAdmin ? { label: "Tambah Tagihan", onClick: () => setBillModal("new") } : null} />
      {sorted.length === 0 && <div className="text-sm" style={{ color: C.textMuted }}>Belum ada data tagihan.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map((b) => {
          const cat = getCat(b.category || "belanja");
          const CatIcon = isValidIcon(cat.icon) ? cat.icon : Tag;
          const isPaid = b.paidAmount >= b.amount;
          const due = new Date(b.dueDate);
          const overdue = !isPaid && due < today;
          const soon = !isPaid && !overdue && (due - today) / 86400000 <= 5;
          const pct = b.amount ? (b.paidAmount / b.amount) * 100 : 0;
          const daysLeft = Math.ceil((due - today) / 86400000);
          return (
            <Card key={b.id} C={C} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: C.text }}>{b.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(b.projectId)} · {b.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setBillModal(b)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  {isAdmin && <button onClick={() => { if (confirm(`Hapus tagihan "${b.name}"?`)) setBills((prev) => prev.filter((x) => x.id !== b.id)); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.coralSoft, color: C.coral }} title="Hapus"><Trash2 size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : `${cat.color}22` }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <CatIcon size={17} color={cat.color} />}
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: C.text }}>{fmtIDR(b.paidAmount)}</span><span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(b.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textMuted }}>
                <span>{pct.toFixed(0)}% terbayar</span><span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>
              <div className="mt-2"><Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>{isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}</Badge></div>
              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setPayBill(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}><PlusCircle size={14} /> Bayar</button>
                  <button onClick={() => markFullyPaid(b.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}><CheckCircle2 size={14} /></button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <QuickPaymentModal
        open={!!payBill}
        onClose={() => setPayBill(null)}
        C={C}
        title="Bayar Tagihan"
        itemName={payBill?.name}
        remaining={payBill ? Math.max(0, payBill.amount - payBill.paidAmount) : null}
        confirmLabel="Bayar"
        onConfirm={confirmAddPayment}
      />
    </div>
  );
}

function DebtsView({ C, debts, setDebts, projects, projectName, setDebtModal, isAdmin, activeProject, setTransactions }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...debts].filter((d) => activeProject === "all" || d.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const [payDebt, setPayDebt] = useState(null);
  const confirmAddPayment = (amt) => {
    const debt = payDebt;
    if (!debt) return;
    setDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)));
    setTransactions((prev) => [{ id: uid("t"), type: "expense", projectId: debt.projectId, category: "bayar-hutang", amount: amt, date: new Date().toISOString().slice(0, 10), note: `Cicilan hutang: ${debt.name}` }, ...prev]);
  };
  const markFullyPaid = (id) => {
    const debt = debts.find((d) => d.id === id);
    if (!debt) return;
    const remaining = Math.max(0, debt.amount - debt.paidAmount);
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paidAmount: d.amount } : d)));
    if (remaining > 0) {
      setTransactions((prev) => [{ id: uid("t"), type: "expense", projectId: debt.projectId, category: "bayar-hutang", amount: remaining, date: new Date().toISOString().slice(0, 10), note: `Pelunasan hutang: ${debt.name}` }, ...prev]);
    }
  };
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Hutang" subtitle="Lacak progres pelunasan hutang & pinjaman kawasan" action={isAdmin ? { label: "Tambah Hutang", onClick: () => setDebtModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.length === 0 && <div className="text-sm py-6" style={{ color: C.textMuted }}>Belum ada data hutang.</div>}
        {sorted.map((d) => {
          const isPaid = d.paidAmount >= d.amount;
          const due = new Date(d.dueDate);
          const overdue = !isPaid && due < today;
          const soon = !isPaid && !overdue && (due - today) / 86400000 <= 5;
          const pct = d.amount ? (d.paidAmount / d.amount) * 100 : 0;
          const daysLeft = Math.ceil((due - today) / 86400000);
          return (
            <Card key={d.id} C={C} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: C.text }}>{d.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(d.projectId)} · {d.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setDebtModal(d)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  {isAdmin && <button onClick={() => { if (confirm(`Hapus hutang "${d.name}"?`)) setDebts((prev) => prev.filter((x) => x.id !== d.id)); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.coralSoft, color: C.coral }} title="Hapus"><Trash2 size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : C.goldSoft }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <HandCoins size={17} color={C.gold} />}
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: C.text }}>{fmtIDR(d.paidAmount)}</span><span className="text-xs" style={{ color: C.textMuted }}>/ {fmtIDR(d.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textMuted }}>
                <span>{pct.toFixed(0)}% terlunasi</span><span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>
              <div className="mt-2"><Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>{isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}</Badge></div>
              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setPayDebt(d)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}><PlusCircle size={14} /> Cicil</button>
                  <button onClick={() => markFullyPaid(d.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}><CheckCircle2 size={14} /></button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <QuickPaymentModal
        open={!!payDebt}
        onClose={() => setPayDebt(null)}
        C={C}
        title="Cicil Hutang"
        itemName={payDebt?.name}
        remaining={payDebt ? Math.max(0, payDebt.amount - payDebt.paidAmount) : null}
        confirmLabel="Bayar Cicilan"
        onConfirm={confirmAddPayment}
      />
    </div>
  );
}

const PEOPLE_CATEGORIES = [{ id: "staff-l", label: "Staff Laki-laki" }, { id: "staff-p", label: "Staff Perempuan" }, { id: "anak", label: "Anak" }];
const peopleCatLabel = (id) => PEOPLE_CATEGORIES.find((c) => c.id === id)?.label || id;

function PeopleView({ C, people, setPeople, projects, projectName, setPersonModal, isAdmin, activeProject }) {
  const [filter, setFilter] = useState("all");
  const rows = people.filter((p) => (filter === "all" || p.category === filter) && (activeProject === "all" || p.projectId === activeProject));
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Data Ahli" subtitle="Data staff (laki-laki/perempuan) dan anak-anak di kawasan" action={isAdmin ? { label: "Tambah Data", onClick: () => setPersonModal("new") } : null} />
      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "Semua" }, ...PEOPLE_CATEGORIES].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150" style={{ background: filter === f.id ? C.jadeSoft : C.surface2, color: filter === f.id ? C.jade : C.textMuted, border: `1px solid ${C.border}` }}>{f.label}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows.length === 0 && <div className="text-sm py-6" style={{ color: C.textMuted }}>Belum ada data.</div>}
        {rows.map((p) => (
          <Card key={p.id} C={C}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: C.text }}>{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textMuted }}>{projectName(p.projectId)}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin && <button onClick={() => setPersonModal(p)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}>{p.category === "anak" ? <Baby size={17} color={C.jade} /> : <User size={17} color={C.jade} />}</div>
              </div>
            </div>
            <Badge C={C} tone="jade">{peopleCatLabel(p.category)}</Badge>
            <div className="mt-3 space-y-1.5 text-xs" style={{ color: C.textMuted }}>
              <div className="flex justify-between"><span style={{ color: C.textMuted }}>Nama Ayah</span><span style={{ color: C.text }}>{p.fatherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textMuted }}>Nama Ibu</span><span style={{ color: C.text }}>{p.motherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textMuted }}>Tempat, Tgl Lahir</span><span style={{ color: C.text }}>{p.birthPlace}{p.birthDate ? `, ${fmtDate(p.birthDate)}` : ""}</span></div>
              {p.category !== "anak" && (
                <>
                  <div className="flex justify-between"><span style={{ color: C.textMuted }}>Nama Istri/Suami</span><span style={{ color: C.text }}>{p.spouseName || "-"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textMuted }}>Jumlah Anak</span><span style={{ color: C.text }}>{p.childrenCount ?? 0}</span></div>
                </>
              )}
            </div>
            {(() => {
              const bday = daysUntilBirthday(p.birthDate);
              if (!bday) return null;
              const soon = bday.days <= 30;
              return (
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: soon ? C.gold : C.textMuted }}>
                    <Cake size={13} /> Ultah ke-{bday.nextAge}
                  </span>
                  <Badge C={C} tone={soon ? "gold" : "neutral"}>{bday.days === 0 ? "Hari ini! 🎉" : `${bday.days} hari lagi`}</Badge>
                </div>
              );
            })()}
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView({ C, categoryBreakdown, monthlyTrend, projectComparison, totals, activeProject, projectName }) {
  const modalVsProfitData = totals.income > 0 ? [
    { name: "Modal", value: totals.modal, color: C.blue },
    { name: "Keuntungan", value: totals.profit, color: C.jade },
  ] : [];
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Analitik Keuangan" subtitle={activeProject === "all" ? "Wawasan menyeluruh atas kinerja keuangan kawasan" : `Wawasan keuangan untuk ${projectName(activeProject)}`} />
      <div className="grid lg:grid-cols-2 gap-6">
        {activeProject === "all" ? (
          <Card C={C}>
            <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Anggaran vs Realisasi per Projek</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" stroke={C.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textMuted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                <Bar dataKey="Anggaran" fill={C.blue} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Terpakai" fill={C.gold} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card C={C}>
            <h3 className="mb-1" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Ringkasan Projek Ini</h3>
            <p className="text-xs mb-4" style={{ color: C.textMuted }}>Pilih "Semua Projek" di sidebar untuk membandingkan antar projek.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs mb-1" style={{ color: C.textMuted }}>Pemasukan</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700, color: C.jade }}>{fmtIDR(totals.income)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: C.textMuted }}>Pengeluaran</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700, color: C.coral }}>{fmtIDR(totals.expense)}</div>
              </div>
              <div>
                <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.blue }}><Coins size={11} /> Modal</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{fmtIDR(totals.modal)}</div>
              </div>
              <div>
                <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.jade }}><TrendingUp size={11} /> Keuntungan</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{fmtIDR(totals.profit)}</div>
              </div>
            </div>
          </Card>
        )}
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Pembagian Pemasukan</h3>
          {modalVsProfitData.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textMuted }}>Belum ada pemasukan</div> :
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={modalVsProfitData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {modalVsProfitData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-2.5 rounded-lg" style={{ background: `${C.blue}15` }}>
                  <div className="text-[11px] font-medium" style={{ color: C.blue }}>Total Modal</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: C.text }}>{fmtIDR(totals.modal)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{totals.income ? ((totals.modal / totals.income) * 100).toFixed(1) : 0}%</div>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: C.jadeSoft }}>
                  <div className="text-[11px] font-medium" style={{ color: C.jade }}>Total Keuntungan</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: C.text }}>{fmtIDR(totals.profit)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{totals.income ? ((totals.profit / totals.income) * 100).toFixed(1) : 0}%</div>
                </div>
              </div>
            </>
          }
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Komposisi Pengeluaran</h3>
          {categoryBreakdown.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textMuted }}>Belum ada data</div> :
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
              </PieChart>
            </ResponsiveContainer>
          }
        </Card>
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: C.text }}>Arus Kas Bulanan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" stroke={C.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textMuted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} formatter={(v) => fmtIDR(v)} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
              <Bar dataKey="Modal" stackId="a" fill={C.blue} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Keuntungan" stackId="a" fill={C.jade} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill={C.coral} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function ViewHeader({ C, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, color: C.text }}>{title}</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.03] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>
          <Plus size={15} /> {action.label}
        </button>
      )}
    </div>
  );
}

function ManageCategoriesModal({ open, onClose, C, categories, setCategories }) {
  const [newName, setNewName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories(prev => [...prev, {
      id: "cat_" + Date.now(),
      label: newName.trim(),
      icon: Tag,
      color: color,
      default: false
    }]);
    setNewName("");
  };
  const handleDelete = (id) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      return next.length > 0 ? next : prev;
    });
  };
  return (
    <Modal open={open} onClose={onClose} title="Kelola Kategori" C={C}>
      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
        {categories.map(c => {
          const CatIcon = isValidIcon(c.icon) ? c.icon : Tag;
          return (
            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}>
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${c.color}22` }}>
                  <CatIcon size={12} color={c.color} />
                </div>
                {c.label}
              </div>
              {!c.default && (
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-black/10" style={{ color: C.coral }} title="Hapus">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-4">
        <Field label="Nama Kategori Baru" C={C}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle(C)} placeholder="Contoh: Transportasi" />
        </Field>
        <Field label="Pilih Warna" C={C}>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map(col => (
              <button key={col} onClick={() => setColor(col)} className="w-8 h-8 rounded-full border-2 transition-all" style={{ background: col, borderColor: color === col ? C.text : 'transparent' }} />
            ))}
          </div>
        </Field>
        <button onClick={handleAdd} className="w-full mt-2 py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}>
          Tambah Kategori Baru
        </button>
      </div>
    </Modal>
  );
}

function AddTransactionModal({ open, onClose, C, projects, goals, debts, categories, editing, onAddTransaction, onEditTransaction, onContributeGoal, onPayDebt }) {
  const [type, setType] = useState("expense");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [debtId, setDebtId] = useState(debts?.[0]?.id || "");
  // Split percent khusus transaksi ini (optional override terhadap project default)
  const [customSplit, setCustomSplit] = useState(false);
  const [splitModalPct, setSplitModalPct] = useState(String(DEFAULT_MODAL_PERCENT));
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setType(editing.type); setProjectId(editing.projectId); setCategory(editing.category);
      setAmount(String(editing.amount)); setDate(editing.date); setNote(editing.note);
      if (editing.splitModalPct != null) {
        setCustomSplit(true);
        setSplitModalPct(String(editing.splitModalPct));
      } else {
        setCustomSplit(false);
        setSplitModalPct(String(DEFAULT_MODAL_PERCENT));
      }
    } else if (open && !editing) {
      setType("expense"); setProjectId(projects[0]?.id || ""); setCategory(categories[0]?.id || "");
      setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setNote("");
      setCustomSplit(false);
      setSplitModalPct(String(projects[0]?.modalPercent ?? DEFAULT_MODAL_PERCENT));
    }
  }, [open, editing, projects, categories]);

  // Update split pct saat project berubah (kalau tidak di-custom)
  useEffect(() => {
    if (!customSplit && !isEditing) {
      const p = projects.find((p) => p.id === projectId);
      setSplitModalPct(String(p?.modalPercent ?? DEFAULT_MODAL_PERCENT));
    }
  }, [projectId, projects, customSplit, isEditing]);

  const selectedDebt = (debts || []).find((d) => d.id === debtId);
  const remainingDebt = selectedDebt ? Math.max(0, selectedDebt.amount - selectedDebt.paidAmount) : 0;

  const amtNum = Number(String(amount).replace(/[^0-9]/g, ''));
  const modalPctNum = Math.max(0, Math.min(100, parseFloat(String(splitModalPct).replace(",", ".")) || 0));
  const splitModalAmt = Math.round((amtNum * modalPctNum) / 100);
  const splitProfitAmt = amtNum - splitModalAmt;

  const submit = () => {
    if (!amtNum || amtNum <= 0) return;
    if (isEditing) {
      if (!note || !projectId) return;
      const data = { type, projectId, category: type === "income" ? categories[0]?.id : category, amount: amtNum, date, note };
      if (type === "income") {
        data.splitModal = splitModalAmt;
        data.splitProfit = splitProfitAmt;
        data.splitModalPct = modalPctNum;
      }
      onEditTransaction(editing.id, data);
      onClose(); return;
    }
    if (type === "goal") {
      const g = goals.find((x) => x.id === goalId); if (!g) return;
      onAddTransaction({ type: "expense", projectId: g.projectId === "all" ? (projects[0]?.id || "") : g.projectId, category: "tabungan", amount: amtNum, date, note: note || `Setor ke tabungan: ${g.name}` });
      onContributeGoal(goalId, amtNum);
    } else if (type === "debt") {
      const d = (debts || []).find((x) => x.id === debtId); if (!d) return;
      onAddTransaction({ type: "expense", projectId: d.projectId, category: categories[0]?.id, amount: amtNum, date, note: note || `Cicilan hutang: ${d.name}` });
      onPayDebt(debtId, amtNum);
    } else {
      if (!note || !projectId) return;
      const tx = { type, projectId, category: type === "income" ? categories[0]?.id : category, amount: amtNum, date, note };
      if (type === "income") {
        tx.splitModal = splitModalAmt;
        tx.splitProfit = splitProfitAmt;
        tx.splitModalPct = modalPctNum;
      }
      onAddTransaction(tx);
    }
    onClose();
  };

  const ALL_TYPES = [{ id: "expense", label: "Pengeluaran" }, { id: "income", label: "Pemasukan" }, { id: "goal", label: "Ke Tabungan" }, { id: "debt", label: "Bayar Hutang" }];
  const TYPES = isEditing ? ALL_TYPES.filter((t) => t.id === "expense" || t.id === "income") : ALL_TYPES;
  const typeColor = (tp) => (tp === "income" ? C.jade : tp === "goal" ? C.blue : tp === "debt" ? C.gold : C.coral);

  const selectedProject = projects.find((p) => p.id === projectId);
  const effectivePct = selectedProject?.modalPercent ?? DEFAULT_MODAL_PERCENT;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"} C={C}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TYPES.map((tp) => (
          <button key={tp.id} onClick={() => setType(tp.id)} className="py-2 rounded-lg text-sm font-medium transition-all duration-150" style={{ background: type === tp.id ? `${typeColor(tp.id)}22` : C.surface2, color: type === tp.id ? typeColor(tp.id) : C.textMuted }}>{tp.label}</button>
        ))}
      </div>
      {(type === "expense" || type === "income") && (
        <>
          <Field label="Projek" C={C}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
              {projects.length === 0 && <option value="">(Buat projek dulu)</option>}
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
          {goals.length === 0 ? <div className="text-xs py-2" style={{ color: C.textMuted }}>Belum ada target tabungan.</div> : (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={inputStyle(C)}>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name} ({fmtIDR(g.current)} / {fmtIDR(g.target)})</option>)}
            </select>
          )}
        </Field>
      )}
      {type === "debt" && !isEditing && (
        <Field label="Hutang" C={C}>
          {(!debts || debts.length === 0) ? <div className="text-xs py-2" style={{ color: C.textMuted }}>Belum ada data hutang.</div> : (
            <>
              <select value={debtId} onChange={(e) => setDebtId(e.target.value)} style={inputStyle(C)}>
                {debts.map((d) => <option key={d.id} value={d.id}>{d.name} (sisa {fmtIDR(Math.max(0, d.amount - d.paidAmount))})</option>)}
              </select>
              {selectedDebt && <div className="text-xs mt-1.5" style={{ color: C.textMuted }}>Sisa hutang: {fmtIDR(remainingDebt)}</div>}
            </>
          )}
        </Field>
      )}
      <Field label="Jumlah (Rp)" C={C}><AmountInput value={amount} onChange={setAmount} C={C} /></Field>

      {/* Preview split pemasukan */}
      {type === "income" && amtNum > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: C.textMuted }}>
              <Split size={12} /> Pemasukan akan dibagi otomatis
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={customSplit}
                onChange={(e) => setCustomSplit(e.target.checked)}
                style={{ accentColor: C.jade }}
              />
              <span className="text-[11px]" style={{ color: C.textMuted }}>Override</span>
            </label>
          </div>
          {customSplit && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={splitModalPct}
                  onChange={(e) => setSplitModalPct(e.target.value)}
                  style={{ ...inputStyle(C), padding: "6px 10px", fontSize: 13, width: 80 }}
                />
                <span className="text-xs" style={{ color: C.textMuted }}>% untuk Modal</span>
              </div>
            </div>
          )}
          {!customSplit && (
            <div className="text-[11px] mb-2" style={{ color: C.textMuted }}>
              Menggunakan setting projek: <strong style={{ color: C.text }}>{effectivePct}%</strong> modal
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md" style={{ background: `${C.blue}15` }}>
              <div className="text-[10px] flex items-center gap-1" style={{ color: C.blue }}><Coins size={10} /> Modal ({modalPctNum}%)</div>
              <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(splitModalAmt)}</div>
            </div>
            <div className="p-2 rounded-md" style={{ background: C.jadeSoft }}>
              <div className="text-[10px] flex items-center gap-1" style={{ color: C.jade }}><TrendingUp size={10} /> Keuntungan ({(100 - modalPctNum).toFixed(0)}%)</div>
              <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(splitProfitAmt)}</div>
            </div>
          </div>
        </div>
      )}

      <Field label="Tanggal" C={C}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle(C)} /></Field>
      {(type === "expense" || type === "income") && <Field label="Catatan" C={C}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Pembayaran material" style={inputStyle(C)} /></Field>}
      {(type === "goal" || type === "debt") && !isEditing && <Field label="Catatan (opsional)" C={C}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Otomatis terisi jika dikosongkan" style={inputStyle(C)} /></Field>}
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}</button>
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
    const t = Number(String(target).replace(/[^0-9]/g, ''));
    if (!name || !t || !deadline) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, target: t, deadline }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Target Tabungan" : "Target Tabungan Baru"} C={C}>
      <Field label="Nama Target" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Dana Renovasi" style={inputStyle(C)} /></Field>
      <Field label="Projek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}><option value="all">Seluruh Kawasan</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Target Dana (Rp)" C={C}><AmountInput value={target} onChange={setTarget} C={C} /></Field>
      <Field label="Tenggat" C={C}><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle(C)} /></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Buat Target"}</button>
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
    const a = Number(String(amount).replace(/[^0-9]/g, ''));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, category, amount: a, dueDate, recurring }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Tagihan" : "Tagihan Baru"} C={C}>
      <Field label="Nama Tagihan" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Listrik PLN" style={inputStyle(C)} /></Field>
      <Field label="Projek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length === 0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Kategori" C={C}><select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
      <Field label="Jumlah (Rp)" C={C}><AmountInput value={amount} onChange={setAmount} C={C} /></Field>
      <Field label="Jatuh Tempo" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Pengulangan" C={C}><select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>{["Bulanan", "Tahunan", "Sekali"].map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Simpan Tagihan"}</button>
    </Modal>
  );
}

function AddProjectModal({ open, onClose, C, editing, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [manager, setManager] = useState("");
  const [desc, setDesc] = useState("");
  const [modalPercent, setModalPercent] = useState(String(DEFAULT_MODAL_PERCENT));
  const isEditing = !!editing;
  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setLocation(editing.location); setBudget(String(editing.budget));
      setManager(editing.manager || ""); setDesc(editing.desc || "");
      setModalPercent(String(editing.modalPercent ?? DEFAULT_MODAL_PERCENT));
    } else if (open && !editing) {
      setName(""); setLocation(""); setBudget(""); setManager(""); setDesc("");
      setModalPercent(String(DEFAULT_MODAL_PERCENT));
    }
  }, [open, editing]);
  const submit = () => {
    const b = Number(String(budget).replace(/[^0-9]/g, ''));
    if (!name || !location || !b) return;
    const pctNum = parseFloat(String(modalPercent).replace(",", "."));
    const pct = isNaN(pctNum) ? DEFAULT_MODAL_PERCENT : Math.max(0, Math.min(100, pctNum));
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, location, budget: b, manager, desc, modalPercent: pct });
    onClose();
  };
  const mp = parseFloat(String(modalPercent).replace(",", ".")) || 0;
  const validPct = !isNaN(mp) && mp >= 0 && mp <= 100;
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Projek" : "Projek Baru"} C={C}>
      <Field label="Nama Projek" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Villa Amerta" style={inputStyle(C)} /></Field>
      <Field label="Lokasi" C={C}><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Nusa Dua, Bali" style={inputStyle(C)} /></Field>
      <Field label="Anggaran Bulanan (Rp)" C={C}><AmountInput value={budget} onChange={setBudget} C={C} /></Field>
      <Field label="Penanggung Jawab" C={C}><input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Nama PJ projek" style={inputStyle(C)} /></Field>
      <Field label="Deskripsi" C={C}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat projek" style={inputStyle(C)} /></Field>

      <div className="p-3 rounded-lg mb-3" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Split size={13} color={C.jade} />
          <span className="text-xs font-semibold" style={{ color: C.text }}>Pembagian Pemasukan Otomatis</span>
        </div>
        <div className="text-[11px] mb-2" style={{ color: C.textMuted, lineHeight: 1.5 }}>
          Setiap pemasukan yang masuk ke projek ini akan otomatis dibagi menjadi <strong style={{ color: C.blue }}>Modal</strong> dan <strong style={{ color: C.jade }}>Keuntungan</strong>.
        </div>
        <Field label="Persentase untuk Modal" C={C}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={modalPercent}
              onChange={(e) => setModalPercent(e.target.value)}
              style={{ ...inputStyle(C), width: 90 }}
            />
            <span className="text-sm" style={{ color: C.textMuted }}>% Modal</span>
            <span className="text-sm" style={{ color: C.textMuted }}>·</span>
            <span className="text-sm" style={{ color: C.textMuted }}>{validPct ? (100 - mp).toFixed(0) : 0}% Keuntungan</span>
          </div>
        </Field>
        {validPct && (
          <div className="flex h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div style={{ width: `${mp}%`, background: C.blue, transition: "width .3s" }} />
            <div style={{ width: `${100 - mp}%`, background: C.jade, transition: "width .3s" }} />
          </div>
        )}
      </div>

      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Tambah Projek"}</button>
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
    const a = Number(String(amount).replace(/[^0-9]/g, ''));
    const p = Number(String(paidAmount).replace(/[^0-9]/g, ''));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, amount: a, paidAmount: p || 0, dueDate, recurring }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Hutang" : "Hutang Baru"} C={C}>
      <Field label="Nama Hutang / Kreditur" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Pinjaman Bank Modal Kerja" style={inputStyle(C)} /></Field>
      <Field label="Projek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length === 0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Total Hutang (Rp)" C={C}><AmountInput value={amount} onChange={setAmount} C={C} /></Field>
      <Field label="Sudah Dibayar (Rp)" C={C}><AmountInput value={paidAmount} onChange={setPaidAmount} C={C} /></Field>
      <Field label="Jatuh Tempo / Target Lunas" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Skema" C={C}><select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>{["Cicilan Bulanan", "Sekali", "Tahunan"].map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Simpan Hutang"}</button>
    </Modal>
  );
}

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
    const cc = Number(String(childrenCount).replace(/[^0-9]/g, ''));
    if (!name) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), category, projectId, name, fatherName, motherName, birthPlace, birthDate, spouseName: isChild ? "" : spouseName, childrenCount: isChild ? 0 : cc || 0 }); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Data Ahli" : "Tambah Data Ahli"} C={C}>
      <Field label="Kategori" C={C}><select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>{PEOPLE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
      <Field label="Projek / Kawasan" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length === 0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Nama Lengkap" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" style={inputStyle(C)} /></Field>
      <Field label="Nama Ayah" C={C}><input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Nama ayah" style={inputStyle(C)} /></Field>
      <Field label="Nama Ibu" C={C}><input value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Nama ibu" style={inputStyle(C)} /></Field>
      <Field label="Tempat Lahir" C={C}><input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Contoh: Mataram" style={inputStyle(C)} /></Field>
      <Field label="Tanggal Lahir" C={C}><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle(C)} /></Field>
      {!isChild && (
        <>
          <Field label="Nama Istri / Suami" C={C}><input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} placeholder="Kosongkan jika belum menikah" style={inputStyle(C)} /></Field>
          <Field label="Jumlah Anak" C={C}><input type="text" inputMode="numeric" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
        </>
      )}
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Simpan Data"}</button>
    </Modal>
  );
}
