import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Building2, Receipt, PiggyBank, Bell, BarChart3,
  Plus, Moon, Sun, Cloud, CloudOff, X, TrendingUp, TrendingDown,
  Wallet, Calendar, MapPin, Trash2, AlertTriangle, CheckCircle2,
  Wrench, Zap, Users, Megaphone, Package, FileText, ShoppingBag,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, ChevronDown,
  Landmark, Sparkles, Clock, PlusCircle, LogOut, ShieldCheck, UserCog, Lock, Menu,
  CreditCard, Droplet, Home, HandCoins, Users2, ArrowRightLeft, Baby, User, Pencil
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from "recharts";

/* ---------------------------------------------------------------
   LOCAL STORAGE MOCK (PENGGANTI ./lib/storage)
----------------------------------------------------------------*/
const loadAppData = async () => JSON.parse(localStorage.getItem("lb_data") || "null");
const saveAppData = async (data) => localStorage.setItem("lb_data", JSON.stringify(data));
const subscribeAppData = (cb) => {
  const handler = (e) => {
    if (e.key === "lb_data") cb(JSON.parse(e.newValue || "null"));
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};
const getSession = () => JSON.parse(localStorage.getItem("lb_session") || "null");
const setSession = (u) => localStorage.setItem("lb_session", JSON.stringify(u));
const clearSession = () => localStorage.removeItem("lb_session");

/* ---------------------------------------------------------------
   TOKENS
----------------------------------------------------------------*/
const FONT_LINK_ID = "lb-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

const PALETTE = {
  dark: {
    bg: "#0A1412",
    bgSoft: "#0D1A17",
    surface: "#11201C",
    surface2: "#172620",
    border: "#233C33",
    borderSoft: "#1B2E27",
    text: "#F2EFE6",
    textMuted: "#8FA69A",
    textFaint: "#5E7A6E",
    jade: "#34D8A3",
    jadeSoft: "rgba(52,216,163,0.12)",
    gold: "#E0B15C",
    goldSoft: "rgba(224,177,92,0.14)",
    coral: "#F0725A",
    coralSoft: "rgba(240,114,90,0.14)",
    blue: "#6FB3D9",
  },
  light: {
    bg: "#F6F4EC",
    bgSoft: "#EFEBDF",
    surface: "#FFFFFF",
    surface2: "#FBF9F2",
    border: "#E3DFCF",
    borderSoft: "#ECE8DA",
    text: "#182420",
    textMuted: "#5C6E64",
    textFaint: "#8A9A90",
    jade: "#1E9E75",
    jadeSoft: "rgba(30,158,117,0.10)",
    gold: "#B4842E",
    goldSoft: "rgba(180,132,46,0.12)",
    coral: "#D6533B",
    coralSoft: "rgba(214,83,59,0.10)",
    blue: "#3E7FA8",
  },
};

const CATEGORIES = [
  { id: "bayar-hutang", label: "Bayar Hutang", icon: CreditCard, color: "#E0B15C" },
  { id: "pdam", label: "PDAM", icon: Droplet, color: "#6FB3D9" },
  { id: "listrik", label: "Listrik", icon: Zap, color: "#C98BD9" },
  { id: "belanja", label: "Belanja", icon: ShoppingBag, color: "#34D8A3" },
  { id: "sewa-rumah", label: "Sewa Rumah", icon: Home, color: "#F0725A" },
  { id: "tabungan", label: "Tabungan", icon: PiggyBank, color: "#5FA8D3" },
];
const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const PROJECT_COLORS = ["#34D8A3", "#E0B15C", "#6FB3D9", "#F0725A", "#C98BD9"];

/* ---------------------------------------------------------------
   SEED DATA
----------------------------------------------------------------*/
const seedProjects = () => [
  { id: "p1", name: "Villa Kayangan", location: "Ubud, Bali", color: PROJECT_COLORS[0], budget: 150000000, manager: "Dewa Made Aditya", desc: "Kompleks 8 vila privat dengan kolam renang tepi sawah." },
  { id: "p2", name: "Senggigi Bay Resort", location: "Senggigi, Lombok", color: PROJECT_COLORS[1], budget: 220000000, manager: "Ni Luh Sartika", desc: "Resor tepi pantai 42 kamar, tahap pembangunan fase 2." },
  { id: "p3", name: "Canggu Beach Club", location: "Canggu, Bali", color: PROJECT_COLORS[2], budget: 180000000, manager: "I Wayan Surya", desc: "Beach club & restoran dengan kapasitas 300 pengunjung." },
  { id: "p4", name: "Gili Eco Retreat", location: "Gili Trawangan, Lombok", color: PROJECT_COLORS[3], budget: 95000000, manager: "Baiq Rahayu", desc: "Retreat ramah lingkungan berbasis energi surya." },
];

const D = (y, m, d) => new Date(y, m - 1, d).toISOString().slice(0, 10);

const seedTransactions = () => [
  { id: "t1", projectId: "p1", type: "expense", category: "sewa-rumah", amount: 42000000, date: D(2026, 8, 2), note: "Pengecoran pondasi vila 5-8" },
  { id: "t2", projectId: "p1", type: "expense", category: "belanja", amount: 8500000, date: D(2026, 8, 6), note: "Furnitur teras" },
  { id: "t3", projectId: "p1", type: "income", category: "belanja", amount: 60000000, date: D(2026, 8, 1), note: "Pencairan dana investor tahap 3" },
  { id: "t4", projectId: "p2", type: "expense", category: "sewa-rumah", amount: 75000000, date: D(2026, 8, 4), note: "Struktur atap sayap timur" },
  { id: "t5", projectId: "p2", type: "expense", category: "bayar-hutang", amount: 34000000, date: D(2026, 8, 5), note: "Gaji tim proyek Agustus" },
  { id: "t6", projectId: "p2", type: "expense", category: "listrik", amount: 6200000, date: D(2026, 8, 10), note: "Listrik & air site" },
  { id: "t7", projectId: "p2", type: "income", category: "belanja", amount: 100000000, date: D(2026, 8, 1), note: "Termin pembayaran investor" },
  { id: "t8", projectId: "p3", type: "expense", category: "belanja", amount: 15000000, date: D(2026, 8, 8), note: "Kampanye peluncuran & influencer" },
  { id: "t9", projectId: "p3", type: "expense", category: "belanja", amount: 22000000, date: D(2026, 8, 9), note: "Bahan baku F&B" },
  { id: "t10", projectId: "p3", type: "expense", category: "bayar-hutang", amount: 28000000, date: D(2026, 8, 12), note: "Gaji staf operasional" },
  { id: "t11", projectId: "p3", type: "income", category: "belanja", amount: 48000000, date: D(2026, 8, 15), note: "Pendapatan soft-opening" },
  { id: "t12", projectId: "p4", type: "expense", category: "sewa-rumah", amount: 19000000, date: D(2026, 8, 3), note: "Instalasi panel surya" },
  { id: "t13", projectId: "p4", type: "expense", category: "pdam", amount: 4200000, date: D(2026, 8, 7), note: "Retribusi izin lingkungan" },
  { id: "t14", projectId: "p4", type: "income", category: "belanja", amount: 30000000, date: D(2026, 8, 2), note: "Dana hibah pariwisata hijau" },
  { id: "t15", projectId: "p1", type: "expense", category: "bayar-hutang", amount: 21000000, date: D(2026, 7, 28), note: "Gaji tukang & mandor Juli" },
  { id: "t16", projectId: "p2", type: "expense", category: "belanja", amount: 12500000, date: D(2026, 7, 20), note: "Keramik & sanitari" },
  { id: "t17", projectId: "p3", type: "expense", category: "listrik", amount: 5100000, date: D(2026, 7, 18), note: "Internet & listrik bulanan" },
  { id: "t18", projectId: "p4", type: "expense", category: "belanja", amount: 7300000, date: D(2026, 7, 22), note: "Perlengkapan kebersihan pantai" },
  { id: "t19", projectId: "p1", type: "expense", category: "belanja", amount: 6000000, date: D(2026, 7, 15), note: "Foto & video promosi" },
  { id: "t20", projectId: "p2", type: "expense", category: "pdam", amount: 9800000, date: D(2026, 7, 10), note: "IMB tambahan fase 2" },
];

const seedGoals = () => [
  { id: "g1", projectId: "p1", name: "Dana Renovasi Kolam", target: 80000000, current: 45000000, deadline: D(2026, 11, 30) },
  { id: "g2", projectId: "p4", name: "Ekspansi Dermaga", target: 150000000, current: 30000000, deadline: D(2027, 2, 28) },
  { id: "g3", projectId: "all", name: "Cadangan Darurat Kawasan", target: 200000000, current: 128000000, deadline: D(2026, 12, 31) },
  { id: "g4", projectId: "p3", name: "Renovasi Panggung Musik", target: 60000000, current: 52000000, deadline: D(2026, 9, 30) },
];

const seedBills = () => [
  { id: "b1", projectId: "p1", name: "Sewa Lahan Tahunan", amount: 35000000, paidAmount: 0, category: "sewa-rumah", dueDate: D(2026, 8, 25), recurring: "Tahunan" },
  { id: "b2", projectId: "p2", name: "Asuransi Bangunan", amount: 12500000, paidAmount: 0, category: "bayar-hutang", dueDate: D(2026, 8, 22), recurring: "Tahunan" },
  { id: "b3", projectId: "p3", name: "Internet & TV Kabel", amount: 1800000, paidAmount: 1800000, category: "belanja", dueDate: D(2026, 8, 18), recurring: "Bulanan" },
  { id: "b4", projectId: "p4", name: "Retribusi Sampah", amount: 950000, paidAmount: 0, category: "belanja", dueDate: D(2026, 8, 15), recurring: "Bulanan" },
  { id: "b5", projectId: "p2", name: "Listrik PLN", amount: 8200000, paidAmount: 3000000, category: "listrik", dueDate: D(2026, 8, 28), recurring: "Bulanan" },
  { id: "b6", projectId: "p1", name: "Izin Operasional", amount: 5000000, paidAmount: 0, category: "bayar-hutang", dueDate: D(2026, 9, 5), recurring: "Tahunan" },
];

const seedDebts = () => [
  { id: "d1", projectId: "p1", name: "Pinjaman Bank Modal Kerja", amount: 100000000, paidAmount: 40000000, dueDate: D(2026, 12, 31), recurring: "Cicilan Bulanan" },
  { id: "d2", projectId: "p2", name: "Hutang Supplier Material", amount: 45000000, paidAmount: 45000000, dueDate: D(2026, 8, 10), recurring: "Sekali" },
  { id: "d3", projectId: "p4", name: "Pinjaman Koperasi", amount: 25000000, paidAmount: 5000000, dueDate: D(2027, 3, 1), recurring: "Cicilan Bulanan" },
];

const seedPeople = () => [
  { id: "ah1", category: "staff-l", projectId: "p1", name: "I Made Suarta", fatherName: "I Nengah Sujana", motherName: "Ni Wayan Ratih", birthPlace: "Mataram", birthDate: D(1988, 5, 12), spouseName: "Ni Putu Ayu", childrenCount: 2 },
  { id: "ah2", category: "staff-p", projectId: "p2", name: "Baiq Rahayu", fatherName: "L. Sujono", motherName: "Baiq Sriwati", birthPlace: "Praya", birthDate: D(1992, 2, 20), spouseName: "", childrenCount: 1 },
  { id: "ah3", category: "staff-l", projectId: "p3", name: "I Wayan Surya", fatherName: "I Ketut Rendra", motherName: "Ni Made Sinta", birthPlace: "Denpasar", birthDate: D(1985, 9, 3), spouseName: "Ni Kadek Widya", childrenCount: 3 },
  { id: "ah4", category: "anak", projectId: "p1", name: "Kadek Wira Suarta", fatherName: "I Made Suarta", motherName: "Ni Putu Ayu", birthPlace: "Ubud", birthDate: D(2015, 6, 14), spouseName: "", childrenCount: 0 },
];

/* ---------------------------------------------------------------
   HELPERS
----------------------------------------------------------------*/
const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const monthKey = (s) => s.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};
const uid = (p) => p + Math.random().toString(36).slice(2, 9);

/* ---------------------------------------------------------------
   CONTOUR SIGNATURE ELEMENT
----------------------------------------------------------------*/
function ContourLines({ color = "#34D8A3", opacity = 0.14, className = "" }) {
  const paths = [
    "M-20,120 C 80,60 160,180 260,100 S 420,40 520,110",
    "M-20,160 C 90,100 170,220 270,140 S 430,80 520,150",
    "M-20,200 C 100,140 180,260 280,180 S 440,120 520,190",
    "M-20,240 C 110,180 190,300 290,220 S 450,160 520,230",
    "M-20,40 C 70,10 150,110 250,50 S 410,-10 520,50",
  ];
  return (
    <svg
      className={className}
      viewBox="0 0 500 280"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="1" opacity={opacity - i * 0.012} />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
----------------------------------------------------------------*/
function Card({ C, children, style, className = "", pad = "p-5" }) {
  return (
    <div
      className={`rounded-2xl ${pad} ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone = "neutral", C }) {
  const map = {
    neutral: { bg: C.surface2, fg: C.textMuted },
    jade: { bg: C.jadeSoft, fg: C.jade },
    gold: { bg: C.goldSoft, fg: C.gold },
    coral: { bg: C.coralSoft, fg: C.coral },
  };
  const s = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

function ProgressBar({ pct, color, C, height = 8 }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: C.surface2, height }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

function IconBtn({ onClick, children, C, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children, C }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", animation: "lbFadeIn .18s ease" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}`, animation: "lbSlideUp .22s cubic-bezier(.2,.8,.2,1)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "Fraunces, serif" }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
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
const inputStyle = (C) => ({
  background: C.surface2,
  border: `1px solid ${C.border}`,
  color: C.text,
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
});

/* ---------------------------------------------------------------
   LOGIN / ROLE GATE
----------------------------------------------------------------*/
const ROLES = [
  { id: "admin", label: "Admin", desc: "Kelola proyek, anggaran, dan hapus data", icon: ShieldCheck },
  { id: "staff", label: "Staff", desc: "Catat transaksi, tagihan, dan tabungan", icon: UserCog },
];

function LoginScreen({ C, onLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const submit = () => {
    if (!name.trim()) return;
    onLogin({ name: name.trim(), role });
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
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18 }}>Lombok Bali</div>
              <div style={{ fontSize: 11, color: C.textFaint }}>Keuangan Kawasan</div>
            </div>
          </div>
          <div className="text-sm mb-5" style={{ color: C.textMuted }}>Masuk untuk mengakses data keuangan kawasan yang tersinkron di seluruh tim.</div>

          <Field label="Nama Anda" C={C}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Made Wirawan" style={inputStyle(C)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>

          <div className="block mb-2 text-xs font-medium" style={{ color: C.textMuted }}>Peran</div>
          <div className="space-y-2 mb-5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button key={r.id} onClick={() => setRole(r.id)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150"
                  style={{ background: active ? C.jadeSoft : C.surface2, border: `1px solid ${active ? C.jade : C.border}` }}>
                  <Icon size={18} color={active ? C.jade : C.textMuted} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: active ? C.jade : C.text }}>{r.label}</div>
                    <div className="text-xs" style={{ color: C.textFaint }}>{r.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={submit} disabled={!name.trim()} className="w-full py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
            style={{ background: name.trim() ? C.jade : C.surface2, color: name.trim() ? "#08130F" : C.textFaint }}>
            <Lock size={15} /> Masuk
          </button>
          <div className="text-xs mt-4 text-center" style={{ color: C.textFaint }}>Data dibagikan (shared) ke semua anggota tim yang masuk ke aplikasi ini.</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN APP
----------------------------------------------------------------*/
export default function App() {
  useFonts();
  const [isDark, setIsDark] = useState(true);
  const C = isDark ? PALETTE.dark : PALETTE.light;

  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    setUser(getSession());
    setUserLoaded(true);
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    setSession(u);
  };
  const handleLogout = () => {
    setUser(null);
    clearSession();
  };

  const [projects, setProjects] = useState(seedProjects());
  const [transactions, setTransactions] = useState(seedTransactions());
  const [goals, setGoals] = useState(seedGoals());
  const [bills, setBills] = useState(seedBills());
  const [activeProject, setActiveProject] = useState("all");
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState("idle"); // idle | saving | saved
  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);

  const [txModal, setTxModal] = useState(null); // null closed | 'new' | transaction object being edited
  const [goalModal, setGoalModal] = useState(null);
  const [billModal, setBillModal] = useState(null);
  const [debtModal, setDebtModal] = useState(null);
  const [personModal, setPersonModal] = useState(null);
  const [projModal, setProjModal] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [debts, setDebts] = useState(seedDebts());
  const [people, setPeople] = useState(seedPeople());

  // ---- Load from LocalStorage on mount ----
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
      }
      setLoaded(true);
    })();
  }, []);

  // ---- Listen for live changes from other users/devices ----
  useEffect(() => {
    const unsubscribe = subscribeAppData((data) => {
      skipNextSave.current = true;
      if (data.projects) setProjects(data.projects);
      if (data.transactions) setTransactions(data.transactions);
      if (data.goals) setGoals(data.goals);
      if (data.bills) setBills(data.bills);
      if (data.debts) setDebts(data.debts);
      if (data.people) setPeople(data.people);
      setSyncState("saved");
    });
    return unsubscribe;
  }, []);

  // ---- Save to LocalStorage on change (debounced) ----
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSyncState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveAppData({ projects, transactions, goals, bills, debts, people });
      setSyncState("saved");
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [projects, transactions, goals, bills, debts, people, loaded]);

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
  const monthBudget = useMemo(
    () => (activeProject === "all" ? projects.reduce((s, p) => s + p.budget, 0) : projects.find((p) => p.id === activeProject)?.budget || 0),
    [projects, activeProject]
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    scopedTx.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return CATEGORIES.map((c) => ({ ...c, value: map[c.id] || 0 })).filter((c) => c.value > 0);
  }, [scopedTx]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => activeProject === "all" || t.projectId === activeProject)
      .forEach((t) => {
        const k = monthKey(t.date);
        if (!map[k]) map[k] = { month: k, Pemasukan: 0, Pengeluaran: 0 };
        if (t.type === "income") map[k].Pemasukan += t.amount;
        else map[k].Pengeluaran += t.amount;
      });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({ ...r, label: monthLabel(r.month) }));
  }, [transactions, activeProject]);

  const projectComparison = useMemo(
    () =>
      projects.map((p) => {
        const exp = transactions.filter((t) => t.projectId === p.id && t.type === "expense" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0);
        return { name: p.name.split(" ")[0], Anggaran: p.budget, Terpakai: exp };
      }),
    [projects, transactions, thisMonthKey]
  );

  const upcomingBills = useMemo(
    () =>
      bills
        .filter((b) => activeProject === "all" || b.projectId === activeProject)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills, activeProject]
  );

  const scopedGoals = useMemo(
    () => goals.filter((g) => activeProject === "all" || g.projectId === activeProject || g.projectId === "all"),
    [goals, activeProject]
  );

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "Kawasan (Semua Proyek)";
  const projectColor = (id) => projects.find((p) => p.id === id)?.color || C.jade;
  const isAdmin = user?.role === "admin";

  if (!userLoaded) {
    return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  }
  if (!user) {
    return <LoginScreen C={C} onLogin={handleLogin} />;
  }

  const NAV = [
    { id: "people", label: "Ahli", icon: Users2 },
    { id: "dashboard", label: "Dasbor", icon: LayoutDashboard },
    { id: "projects", label: "Proyek", icon: Building2 },
    { id: "transactions", label: "Transaksi", icon: Receipt },
    { id: "budget", label: "Anggaran", icon: Wallet },
    { id: "savings", label: "Tabungan", icon: PiggyBank },
    { id: "bills", label: "Tagihan", icon: Bell },
    { id: "debts", label: "Hutang", icon: HandCoins },
    { id: "analytics", label: "Analitik", icon: BarChart3 },
  ];

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
        transition: "background .3s ease, color .3s ease",
      }}
    >
      <style>{`
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbSlideUp { from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} }
        @keyframes lbFadeUp { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        .lb-anim { animation: lbFadeUp .35s cubic-bezier(.2,.8,.2,1) both; }
        .lb-row:hover { background: ${C.surface2} !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        * { scrollbar-color: ${C.border} transparent; }
      `}</style>

      <div className="flex">
        {/* SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 px-4 py-6`}
          style={{ background: C.bgSoft, borderRight: `1px solid ${C.border}` }}
        >
          <Brand C={C} />
          <ProjectSwitcher {...{ projects, activeProject, setActiveProject, C }} />
          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((n) => (
              <NavItem key={n.id} n={n} active={tab === n.id} onClick={() => setTab(n.id)} C={C} />
            ))}
          </nav>
          <SyncFooter syncState={syncState} isDark={isDark} setIsDark={setIsDark} C={C} user={user} onLogout={handleLogout} />
        </aside>

        {/* MOBILE TOP BAR */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <IconBtn C={C} onClick={() => setMobileNav(true)}><Menu size={16} /></IconBtn>
            <Brand C={C} compact />
          </div>
          <IconBtn C={C} onClick={() => setIsDark((d) => !d)}>{isDark ? <Sun size={16} /> : <Moon size={16} />}</IconBtn>
        </div>

        {/* MOBILE SLIDE-IN SIDEBAR */}
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ pointerEvents: mobileNav ? "auto" : "none" }}
          aria-hidden={!mobileNav}
        >
          {/* backdrop */}
          <div
            onClick={() => setMobileNav(false)}
            style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
              opacity: mobileNav ? 1 : 0, transition: "opacity .25s ease",
            }}
          />
          {/* drawer */}
          <div
            className="absolute top-0 left-0 h-full w-72 max-w-[82vw] px-4 py-5 flex flex-col overflow-y-auto"
            style={{
              background: C.bgSoft, borderRight: `1px solid ${C.border}`,
              transform: mobileNav ? "translateX(0)" : "translateX(-100%)",
              transition: "transform .28s cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Brand C={C} />
              <button onClick={() => setMobileNav(false)} style={{ color: C.textMuted }}><X size={20} /></button>
            </div>

            <ProjectSwitcher {...{ projects, activeProject, setActiveProject: (v) => { setActiveProject(v); setMobileNav(false); }, C }} />

            <nav className="mt-6 flex-1 space-y-1">
              {NAV.map((n) => (
                <NavItem key={n.id} n={n} active={tab === n.id} onClick={() => { setTab(n.id); setMobileNav(false); }} C={C} />
              ))}
            </nav>

            <SyncFooter syncState={syncState} isDark={isDark} setIsDark={setIsDark} C={C} user={user} onLogout={handleLogout} />
          </div>
        </div>

        {/* MAIN */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 md:py-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
          {tab === "dashboard" && (
            <Dashboard {...{ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people }} />
          )}
          {tab === "projects" && (
            <ProjectsView {...{ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin }} />
          )}
          {tab === "transactions" && (
            <TransactionsView {...{ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin }} />
          )}
          {tab === "budget" && (
            <BudgetView {...{ C, projects, transactions, thisMonthKey }} />
          )}
          {tab === "savings" && (
            <SavingsView {...{ C, goals, setGoals, projects, projectName, setGoalModal, isAdmin }} />
          )}
          {tab === "bills" && (
            <BillsView {...{ C, bills, setBills, projects, projectName, setBillModal, isAdmin }} />
          )}
          {tab === "debts" && (
            <DebtsView {...{ C, debts, setDebts, projects, projectName, setDebtModal, isAdmin }} />
          )}
          {tab === "people" && (
            <PeopleView {...{ C, people, setPeople, projects, projectName, setPersonModal, isAdmin }} />
          )}
          {tab === "analytics" && (
            <AnalyticsView {...{ C, categoryBreakdown, monthlyTrend, projectComparison, totals }} />
          )}
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={() => setTxModal("new")}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: C.jade, color: "#08130F", fontWeight: 600, boxShadow: `0 8px 24px ${C.jadeSoft}` }}
      >
        <Plus size={18} /> <span className="hidden sm:inline">Transaksi</span>
      </button>

      <AddTransactionModal
        open={!!txModal}
        editing={txModal && txModal !== "new" ? txModal : null}
        onClose={() => setTxModal(null)}
        C={C} projects={projects} goals={goals} debts={debts}
        onAddTransaction={(t) => setTransactions((prev) => [{ id: uid("t"), ...t }, ...prev])}
        onEditTransaction={(id, data) => setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))}
        onContributeGoal={(goalId, amt) => setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, current: g.current + amt } : g)))}
        onPayDebt={(debtId, amt) => setDebts((prev) => prev.map((d) => (d.id === debtId ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)))}
      />
      <AddGoalModal
        open={!!goalModal}
        editing={goalModal && goalModal !== "new" ? goalModal : null}
        onClose={() => setGoalModal(null)}
        C={C} projects={projects}
        onSave={(data) => {
          if (data.id) setGoals((prev) => prev.map((g) => (g.id === data.id ? { ...g, ...data } : g)));
          else setGoals((prev) => [{ id: uid("g"), current: 0, ...data }, ...prev]);
        }}
      />
      <AddBillModal
        open={!!billModal}
        editing={billModal && billModal !== "new" ? billModal : null}
        onClose={() => setBillModal(null)}
        C={C} projects={projects}
        onSave={(data) => {
          if (data.id) setBills((prev) => prev.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
          else setBills((prev) => [{ id: uid("b"), paidAmount: 0, ...data }, ...prev]);
        }}
      />
      <AddDebtModal
        open={!!debtModal}
        editing={debtModal && debtModal !== "new" ? debtModal : null}
        onClose={() => setDebtModal(null)}
        C={C} projects={projects}
        onSave={(data) => {
          if (data.id) setDebts((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data } : d)));
          else setDebts((prev) => [{ id: uid("d"), paidAmount: 0, ...data }, ...prev]);
        }}
      />
      <AddPersonModal
        open={!!personModal}
        editing={personModal && personModal !== "new" ? personModal : null}
        onClose={() => setPersonModal(null)}
        C={C} projects={projects}
        onSave={(data) => {
          if (data.id) setPeople((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
          else setPeople((prev) => [{ id: uid("ah"), ...data }, ...prev]);
        }}
      />
      <AddProjectModal
        open={!!projModal}
        editing={projModal && projModal !== "new" ? projModal : null}
        onClose={() => setProjModal(null)}
        C={C}
        onSave={(data) => {
          if (data.id) setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
          else setProjects((prev) => [...prev, { id: uid("p"), color: PROJECT_COLORS[prev.length % PROJECT_COLORS.length], ...data }]);
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   NAV PIECES
----------------------------------------------------------------*/
function Brand({ C, compact }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${C.jade}, ${C.blue})` }}>
        <Landmark size={18} color="#08130F" />
      </div>
      {!compact && (
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, lineHeight: 1 }}>Lombok Bali</div>
          <div style={{ fontSize: 11, color: C.textFaint, letterSpacing: 0.3 }}>Keuangan Kawasan</div>
        </div>
      )}
      {compact && <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Lombok Bali</div>}
    </div>
  );
}

function ProjectSwitcher({ projects, activeProject, setActiveProject, C }) {
  return (
    <div className="mt-6">
      <div className="text-xs font-medium mb-2 px-1" style={{ color: C.textFaint }}>KAWASAN</div>
      <button
        onClick={() => setActiveProject("all")}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-sm transition-all duration-150"
        style={{
          background: activeProject === "all" ? C.jadeSoft : "transparent",
          color: activeProject === "all" ? C.jade : C.textMuted,
          fontWeight: activeProject === "all" ? 600 : 500,
        }}
      >
        <Sparkles size={15} /> Semua Proyek
      </button>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProject(p.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
            style={{
              background: activeProject === p.id ? C.surface2 : "transparent",
              color: activeProject === p.id ? C.text : C.textMuted,
              fontWeight: activeProject === p.id ? 600 : 500,
            }}
          >
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
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
      style={{ background: active ? C.surface2 : "transparent", color: active ? C.jade : C.textMuted, fontWeight: active ? 600 : 500 }}
    >
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
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs capitalize" style={{ color: C.textFaint }}>{user.role === "admin" ? "Admin" : "Staff"}</div>
          </div>
          <button onClick={onLogout} title="Keluar" className="p-1.5 rounded-md transition-transform duration-150 hover:scale-110" style={{ color: C.textFaint }}>
            <LogOut size={15} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.textFaint }}>
          {syncState === "saving" ? <Cloud size={14} className="animate-pulse" /> : <Cloud size={14} style={{ color: C.jade }} />}
          {syncState === "saving" ? "Menyimpan…" : "Tersimpan lokal"}
        </div>
      </div>
      <button
        onClick={() => setIsDark((d) => !d)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
        style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />} {isDark ? "Mode Terang" : "Mode Gelap"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD
----------------------------------------------------------------*/
function Dashboard({ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people }) {
  const budgetPct = monthBudget ? (monthSpend / monthBudget) * 100 : 0;
  const recent = scopedTx.slice(0, 5);
  const dueSoon = upcomingBills.filter((b) => b.paidAmount < b.amount).slice(0, 4);

  return (
    <div className="space-y-6 lb-anim">
      {/* PEOPLE / AHLI SUMMARY (paling atas) */}
      {people && people.length > 0 && (
        <Card C={C} pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Data Ahli</h3>
            <button onClick={() => setTab("people")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="grid grid-cols-3 gap-4 px-5 pb-5">
            {[
              { key: "staff-l", label: "Staff Laki-laki", icon: User },
              { key: "staff-p", label: "Staff Perempuan", icon: User },
              { key: "anak", label: "Anak-anak", icon: Baby },
            ].map((g) => {
              const Icon = g.icon;
              const count = people.filter((p) => p.category === g.key).length;
              return (
                <div key={g.key} className="rounded-xl p-3.5" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                  <Icon size={16} color={C.jade} />
                  <div className="text-xl font-bold mt-2" style={{ fontFamily: "Fraunces, serif" }}>{count}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{g.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-9" style={{ background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`, border: `1px solid ${C.border}` }}>
        <ContourLines color={C.jade} opacity={isDark ? 0.16 : 0.09} />
        <div className="relative">
          <div className="text-xs font-medium tracking-wide mb-2" style={{ color: C.textFaint }}>
            {activeProject === "all" ? "SELURUH KAWASAN" : projectName(activeProject).toUpperCase()}
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>Saldo Bersih</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 32, fontWeight: 600, color: totals.balance >= 0 ? C.jade : C.coral }}>
                {fmtIDR(totals.balance)}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowUpRight size={14} color={C.jade} /> Pemasukan</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600 }}>{fmtIDR(totals.income)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowDownRight size={14} color={C.coral} /> Pengeluaran</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600 }}>{fmtIDR(totals.expense)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: C.textMuted, fontSize: 13 }}>Proyek Aktif</span>
            <Building2 size={16} color={C.jade} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{projects.length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: C.textMuted, fontSize: 13 }}>Anggaran Bulan Ini</span>
            <Wallet size={16} color={C.gold} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(monthBudget)}</div>
          <div className="mt-2"><ProgressBar pct={budgetPct} color={budgetPct > 90 ? C.coral : C.jade} C={C} /></div>
          <div className="text-xs mt-1" style={{ color: C.textFaint }}>{budgetPct.toFixed(0)}% terpakai</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: C.textMuted, fontSize: 13 }}>Tagihan Menunggu</span>
            <Bell size={16} color={C.coral} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{upcomingBills.filter((b) => b.paidAmount < b.amount).length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: C.textMuted, fontSize: 13 }}>Transaksi</span>
            <Receipt size={16} color={C.blue} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{scopedTx.length}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* TREND */}
        <Card C={C} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Tren Bulanan</h3>
            <Badge C={C} tone="jade"><TrendingUp size={12} /> 6 bulan terakhir</Badge>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Line type="monotone" dataKey="Pemasukan" stroke={C.jade} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke={C.coral} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* CATEGORY */}
        <Card C={C} className="lg:col-span-2">
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Pengeluaran per Kategori</h3>
          {categoryBreakdown.length === 0 ? (
            <div className="text-sm py-10 text-center" style={{ color: C.textFaint }}>Belum ada data pengeluaran</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={45} outerRadius={68} paddingAngle={3}>
                    {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryBreakdown.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* RECENT TX */}
        <Card C={C} className="lg:col-span-3" pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Transaksi Terbaru</h3>
            <button onClick={() => setTab("transactions")} className="text-xs font-medium" style={{ color: C.jade }}>Lihat semua</button>
          </div>
          <div>
            {recent.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textFaint }}>Belum ada transaksi.</div>}
            {recent.map((t) => {
              const cat = catById(t.category);
              const Icon = cat.icon;
              return (
                <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                    {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.note}</div>
                    <div className="text-xs" style={{ color: C.textFaint }}>{projectName(t.projectId)} · {fmtDate(t.date)}</div>
                  </div>
                  <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                    {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* BILLS DUE */}
        <Card C={C} className="lg:col-span-2" pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Tagihan Mendatang</h3>
            <button onClick={() => setTab("bills")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="pb-3">
            {dueSoon.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textFaint }}>Semua tagihan lunas 🎉</div>}
            {dueSoon.map((b) => {
              const overdue = new Date(b.dueDate) < new Date(new Date().toDateString());
              return (
                <div key={b.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: overdue ? C.coralSoft : C.goldSoft }}>
                    {overdue ? <AlertTriangle size={15} color={C.coral} /> : <Clock size={15} color={C.gold} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs" style={{ color: overdue ? C.coral : C.textFaint }}>{projectName(b.projectId)} · jatuh tempo {fmtDate(b.dueDate)}</div>
                  </div>
                  <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(b.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PROJECTS VIEW
----------------------------------------------------------------*/
function ProjectsView({ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin }) {
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Profil Proyek" subtitle="Semua kawasan pengembangan yang sedang berjalan" action={isAdmin ? { label: "Tambah Proyek", onClick: () => setProjModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const tx = transactions.filter((t) => t.projectId === p.id);
          const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          return (
            <Card key={p.id} C={C} pad="p-0" className="overflow-hidden group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              style={{ position: "relative" }}
            >
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setProjModal(p); }}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-transform duration-150 hover:scale-110"
                  style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
                  title="Edit proyek"
                >
                  <Pencil size={13} />
                </button>
              )}
              <div onClick={() => { setActiveProject(p.id); setTab("dashboard"); }}>
                <div className="relative h-20 flex items-end p-4" style={{ background: `linear-gradient(135deg, ${p.color}30, ${p.color}08)` }}>
                  <ContourLines color={p.color} opacity={0.3} />
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.color }}>
                    <Building2 size={18} color="#08130F" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 17 }}>{p.name}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5 mb-3" style={{ color: C.textFaint }}><MapPin size={11} />{p.location}</div>
                  <p className="text-xs mb-4" style={{ color: C.textMuted, lineHeight: 1.5 }}>{p.desc}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <div style={{ color: C.textFaint }}>Pemasukan</div>
                      <div className="font-semibold" style={{ color: C.jade, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(income)}</div>
                    </div>
                    <div>
                      <div style={{ color: C.textFaint }}>Pengeluaran</div>
                      <div className="font-semibold" style={{ color: C.coral, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</div>
                    </div>
                  </div>
                  <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textFaint }}>
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

/* ---------------------------------------------------------------
   TRANSACTIONS VIEW
----------------------------------------------------------------*/
function TransactionsView({ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin }) {
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
      <ViewHeader C={C} title="Riwayat Transaksi" subtitle="Seluruh catatan pemasukan dan pengeluaran kawasan" action={{ label: "Tambah Transaksi", onClick: () => setTxModal("new") }} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.textFaint} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari transaksi…" style={{ ...inputStyle(C), paddingLeft: 34 }} />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense"].map((f) => (
            <button key={f} onClick={() => setFilterType(f)} className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{ background: filterType === f ? C.jadeSoft : C.surface2, color: filterType === f ? C.jade : C.textMuted, border: `1px solid ${C.border}` }}>
              {f === "all" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
      </div>

      <Card C={C} pad="p-0">
        {rows.length === 0 && <div className="p-8 text-center text-sm" style={{ color: C.textFaint }}>Tidak ada transaksi ditemukan.</div>}
        {rows.map((t, i) => {
          const cat = catById(t.category);
          const Icon = cat.icon;
          return (
            <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.borderSoft}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.note}</div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: C.textFaint }}>
                  <span style={{ color: projectColor(t.projectId) }}>●</span> {projectName(t.projectId)} · {fmtDate(t.date)} · {t.type === "expense" ? cat.label : "Pemasukan"}
                </div>
              </div>
              <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setTxModal(t)} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textFaint }} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textFaint }} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------
   BUDGET VIEW
----------------------------------------------------------------*/
function BudgetView({ C, projects, transactions, thisMonthKey }) {
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Anggaran Bulanan" subtitle={`Realisasi vs anggaran untuk ${monthLabel(thisMonthKey)}`} />
      <div className="grid lg:grid-cols-2 gap-5">
        {projects.map((p) => {
          const tx = transactions.filter((t) => t.projectId === p.id && t.type === "expense" && monthKey(t.date) === thisMonthKey);
          const spent = tx.reduce((s, t) => s + t.amount, 0);
          const pct = p.budget ? (spent / p.budget) * 100 : 0;
          const byCat = {};
          tx.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
          const catRows = CATEGORIES.map((c) => ({ ...c, value: byCat[c.id] || 0 })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

          return (
            <Card key={p.id} C={C}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{p.name}</span>
                </div>
                <Badge C={C} tone={pct > 90 ? "coral" : pct > 70 ? "gold" : "jade"}>{pct.toFixed(0)}%</Badge>
              </div>
              <div className="flex items-baseline justify-between text-sm mb-2" style={{ color: C.textMuted }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</span>
                <span>dari {fmtIDR(p.budget)}</span>
              </div>
              <ProgressBar pct={pct} color={pct > 90 ? C.coral : pct > 70 ? C.gold : C.jade} C={C} height={10} />

              <div className="mt-4 space-y-2.5">
                {catRows.length === 0 && <div className="text-xs" style={{ color: C.textFaint }}>Belum ada pengeluaran bulan ini.</div>}
                {catRows.map((c) => {
                  const Icon = c.icon;
                  const catPct = p.budget ? (c.value / p.budget) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><Icon size={12} color={c.color} />{c.label}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(c.value)}</span>
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

/* ---------------------------------------------------------------
   SAVINGS VIEW
----------------------------------------------------------------*/
function SavingsView({ C, goals, setGoals, projects, projectName, setGoalModal, isAdmin }) {
  const addFunds = (id) => {
    const amtStr = window.prompt("Tambah dana tabungan (Rp):");
    if (!amtStr) return;
    const n = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!n || n <= 0) return;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current: g.current + n } : g)));
  };
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Target Tabungan" subtitle="Rencana dana jangka panjang untuk setiap kawasan" action={isAdmin ? { label: "Tambah Target", onClick: () => setGoalModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {goals.map((g) => {
          const pct = g.target ? (g.current / g.target) * 100 : 0;
          const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
          return (
            <Card key={g.id} C={C} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{g.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(g.projectId === "all" ? undefined : g.projectId) || "Seluruh Kawasan"}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <button onClick={() => setGoalModal(g)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit">
                      <Pencil size={13} />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}>
                    <PiggyBank size={17} color={C.jade} />
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(g.current)}</span>
                <span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(g.target)}</span>
              </div>
              <ProgressBar pct={pct} color={C.jade} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% tercapai</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{daysLeft > 0 ? `${daysLeft} hari lagi` : "Jatuh tempo"}</span>
              </div>
              <button onClick={() => addFunds(g.id)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95"
                style={{ background: C.surface2, color: C.jade, border: `1px solid ${C.border}` }}>
                <PlusCircle size={14} /> Tambah Dana
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   BILLS VIEW
----------------------------------------------------------------*/
function BillsView({ C, bills, setBills, projects, projectName, setBillModal, isAdmin }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const addPayment = (id) => {
    const bill = bills.find((b) => b.id === id);
    const amtStr = window.prompt(`Tambah pembayaran untuk "${bill?.name}" (Rp):`);
    if (!amtStr) return;
    const amt = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) return;
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidAmount: Math.min(b.amount, b.paidAmount + amt) } : b)));
  };
  const markFullyPaid = (id) => setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidAmount: b.amount } : b)));

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Pengingat Tagihan" subtitle="Lacak progres pembayaran hingga tagihan lunas" action={isAdmin ? { label: "Tambah Tagihan", onClick: () => setBillModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map((b) => {
          const cat = catById(b.category || "belanja");
          const CatIcon = cat.icon;
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
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{b.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(b.projectId)} · {b.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <button onClick={() => setBillModal(b)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit">
                      <Pencil size={13} />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : `${cat.color}22` }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <CatIcon size={17} color={cat.color} />}
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(b.paidAmount)}</span>
                <span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(b.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />

              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% terbayar</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>

              <div className="mt-2">
                <Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>
                  {isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}
                </Badge>
              </div>

              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => addPayment(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}>
                    <PlusCircle size={14} /> Bayar
                  </button>
                  <button onClick={() => markFullyPaid(b.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}>
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   DEBTS (HUTANG) VIEW
----------------------------------------------------------------*/
function DebtsView({ C, debts, setDebts, projects, projectName, setDebtModal, isAdmin }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...debts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const addPayment = (id) => {
    const debt = debts.find((d) => d.id === id);
    const amtStr = window.prompt(`Tambah cicilan untuk "${debt?.name}" (Rp):`);
    if (!amtStr) return;
    const amt = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) return;
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)));
  };
  const markFullyPaid = (id) => setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paidAmount: d.amount } : d)));

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Hutang" subtitle="Lacak progres pelunasan hutang & pinjaman kawasan" action={isAdmin ? { label: "Tambah Hutang", onClick: () => setDebtModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.length === 0 && <div className="text-sm py-6" style={{ color: C.textFaint }}>Belum ada data hutang.</div>}
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
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{d.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(d.projectId)} · {d.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <button onClick={() => setDebtModal(d)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit">
                      <Pencil size={13} />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : C.goldSoft }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <HandCoins size={17} color={C.gold} />}
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(d.paidAmount)}</span>
                <span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(d.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />

              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% terlunasi</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>

              <div className="mt-2">
                <Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>
                  {isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}
                </Badge>
              </div>

              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => addPayment(d.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}>
                    <PlusCircle size={14} /> Cicil
                  </button>
                  <button onClick={() => markFullyPaid(d.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}>
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PEOPLE (AHLI) VIEW
----------------------------------------------------------------*/
const PEOPLE_CATEGORIES = [
  { id: "staff-l", label: "Staff Laki-laki" },
  { id: "staff-p", label: "Staff Perempuan" },
  { id: "anak", label: "Anak" },
];
const peopleCatLabel = (id) => PEOPLE_CATEGORIES.find((c) => c.id === id)?.label || id;

function PeopleView({ C, people, setPeople, projects, projectName, setPersonModal, isAdmin }) {
  const [filter, setFilter] = useState("all");
  const rows = people.filter((p) => filter === "all" || p.category === filter);

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Data Ahli" subtitle="Data staff (laki-laki/perempuan) dan anak-anak di kawasan" action={isAdmin ? { label: "Tambah Data", onClick: () => setPersonModal("new") } : null} />

      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "Semua" }, ...PEOPLE_CATEGORIES].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ background: filter === f.id ? C.jadeSoft : C.surface2, color: filter === f.id ? C.jade : C.textMuted, border: `1px solid ${C.border}` }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows.length === 0 && <div className="text-sm py-6" style={{ color: C.textFaint }}>Belum ada data.</div>}
        {rows.map((p) => (
          <Card key={p.id} C={C}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(p.projectId)}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin && (
                  <button onClick={() => setPersonModal(p)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit">
                    <Pencil size={13} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}>
                  {p.category === "anak" ? <Baby size={17} color={C.jade} /> : <User size={17} color={C.jade} />}
                </div>
              </div>
            </div>
            <Badge C={C} tone="jade">{peopleCatLabel(p.category)}</Badge>
            <div className="mt-3 space-y-1.5 text-xs" style={{ color: C.textMuted }}>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Ayah</span><span>{p.fatherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Ibu</span><span>{p.motherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Tempat, Tgl Lahir</span><span>{p.birthPlace}{p.birthDate ? `, ${fmtDate(p.birthDate)}` : ""}</span></div>
              {p.category !== "anak" && (
                <>
                  <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Istri/Suami</span><span>{p.spouseName || "-"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textFaint }}>Jumlah Anak</span><span>{p.childrenCount ?? 0}</span></div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ANALYTICS VIEW
----------------------------------------------------------------*/
function AnalyticsView({ C, categoryBreakdown, monthlyTrend, projectComparison }) {
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Analitik Keuangan" subtitle="Wawasan menyeluruh atas kinerja keuangan kawasan" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Anggaran vs Realisasi per Proyek</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={projectComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Anggaran" fill={C.blue} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Terpakai" fill={C.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Komposisi Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card C={C}>
        <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Arus Kas Bulanan</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="label" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
            <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pemasukan" fill={C.jade} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill={C.coral} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------
   SHARED HEADER
----------------------------------------------------------------*/
function ViewHeader({ C, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24 }}>{title}</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.03] active:scale-95"
          style={{ background: C.jade, color: "#08130F" }}>
          <Plus size={15} /> {action.label}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   MODALS
----------------------------------------------------------------*/
function AddTransactionModal({ open, onClose, C, projects, goals, debts, editing, onAddTransaction, onEditTransaction, onContributeGoal, onPayDebt }) {
  const [type, setType] = useState("expense");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [debtId, setDebtId] = useState(debts?.[0]?.id || "");

  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setType(editing.type);
      setProjectId(editing.projectId);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setNote(editing.note);
    } else if (open && !editing) {
      setType("expense");
      setProjectId(projects[0]?.id || "");
      setCategory(CATEGORIES[0].id);
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [open, editing]);

  const selectedDebt = (debts || []).find((d) => d.id === debtId);
  const remainingDebt = selectedDebt ? Math.max(0, selectedDebt.amount - selectedDebt.paidAmount) : 0;

  const reset = () => { setAmount(""); setNote(""); };

  const submit = () => {
    const amt = Number(String(amount).replace(/[^0-9]/g, ''));
    if (!amt || amt <= 0) return;

    if (isEditing) {
      if (!note || !projectId) return;
      onEditTransaction(editing.id, { type, projectId, category: type === "income" ? "belanja" : category, amount: amt, date, note });
      reset();
      onClose();
      return;
    }

    if (type === "goal") {
      const g = goals.find((x) => x.id === goalId);
      if (!g) return;
      onAddTransaction({ type: "expense", projectId: g.projectId === "all" ? (projects[0]?.id || "") : g.projectId, category: "tabungan", amount: amt, date, note: note || `Setor ke tabungan: ${g.name}` });
      onContributeGoal(goalId, amt);
    } else if (type === "debt") {
      const d = (debts || []).find((x) => x.id === debtId);
      if (!d) return;
      onAddTransaction({ type: "expense", projectId: d.projectId, category: "bayar-hutang", amount: amt, date, note: note || `Cicilan hutang: ${d.name}` });
      onPayDebt(debtId, amt);
    } else {
      if (!note || !projectId) return;
      onAddTransaction({ type, projectId, category: type === "income" ? "belanja" : category, amount: amt, date, note });
    }
    reset();
    onClose();
  };

  const ALL_TYPES = [
    { id: "expense", label: "Pengeluaran" },
    { id: "income", label: "Pemasukan" },
    { id: "goal", label: "Ke Tabungan" },
    { id: "debt", label: "Bayar Hutang" },
  ];
  const TYPES = isEditing ? ALL_TYPES.filter((t) => t.id === "expense" || t.id === "income") : ALL_TYPES;
  const typeColor = (tp) => (tp === "income" ? C.jade : tp === "goal" ? C.blue : tp === "debt" ? C.gold : C.coral);

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"} C={C}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TYPES.map((tp) => (
          <button key={tp.id} onClick={() => setType(tp.id)} className="py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ background: type === tp.id ? `${typeColor(tp.id)}22` : C.surface2, color: type === tp.id ? typeColor(tp.id) : C.textMuted }}>
            {tp.label}
          </button>
        ))}
      </div>

      {(type === "expense" || type === "income") && (
        <>
          <Field label="Proyek" C={C}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {type === "expense" && (
            <Field label="Kategori" C={C}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
                {CATEGORIES.filter((c) => c.id !== "tabungan").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          )}
        </>
      )}

      {type === "goal" && !isEditing && (
        <Field label="Target Tabungan" C={C}>
          {goals.length === 0 ? (
            <div className="text-xs py-2" style={{ color: C.textFaint }}>Belum ada target tabungan. Buat dulu di tab Tabungan.</div>
          ) : (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={inputStyle(C)}>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name} ({fmtIDR(g.current)} / {fmtIDR(g.target)})</option>)}
            </select>
          )}
        </Field>
      )}

      {type === "debt" && !isEditing && (
        <Field label="Hutang" C={C}>
          {(!debts || debts.length === 0) ? (
            <div className="text-xs py-2" style={{ color: C.textFaint }}>Belum ada data hutang. Buat dulu di tab Hutang.</div>
          ) : (
            <>
              <select value={debtId} onChange={(e) => setDebtId(e.target.value)} style={inputStyle(C)}>
                {debts.map((d) => <option key={d.id} value={d.id}>{d.name} (sisa {fmtIDR(Math.max(0, d.amount - d.paidAmount))})</option>)}
              </select>
              {selectedDebt && <div className="text-xs mt-1.5" style={{ color: C.textFaint }}>Sisa hutang: {fmtIDR(remainingDebt)}</div>}
            </>
          )}
        </Field>
      )}

      <Field label="Jumlah (Rp)" C={C}>
        <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} />
      </Field>
      <Field label="Tanggal" C={C}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle(C)} />
      </Field>
      {(type === "expense" || type === "income") && (
        <Field label="Catatan" C={C}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Pembayaran material" style={inputStyle(C)} />
        </Field>
      )}
      {(type === "goal" || type === "debt") && !isEditing && (
        <Field label="Catatan (opsional)" C={C}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Otomatis terisi jika dikosongkan" style={inputStyle(C)} />
        </Field>
      )}
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
    if (open && editing) {
      setName(editing.name); setProjectId(editing.projectId); setTarget(String(editing.target)); setDeadline(editing.deadline);
    } else if (open && !editing) {
      setName(""); setProjectId("all"); setTarget(""); setDeadline("");
    }
  }, [open, editing]);

  const submit = () => {
    const t = Number(String(target).replace(/[^0-9]/g, ''));
    if (!name || !t || !deadline) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, target: t, deadline });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Target Tabungan" : "Target Tabungan Baru"} C={C}>
      <Field label="Nama Target" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Dana Renovasi" style={inputStyle(C)} /></Field>
      <Field label="Proyek" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          <option value="all">Seluruh Kawasan</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Target Dana (Rp)" C={C}><input type="text" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Tenggat" C={C}><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle(C)} /></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Buat Target"}</button>
    </Modal>
  );
}

function AddBillModal({ open, onClose, C, projects, editing, onSave }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState("Bulanan");
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setProjectId(editing.projectId); setCategory(editing.category || CATEGORIES[0].id);
      setAmount(String(editing.amount)); setDueDate(editing.dueDate); setRecurring(editing.recurring);
    } else if (open && !editing) {
      setName(""); setProjectId(projects[0]?.id || ""); setCategory(CATEGORIES[0].id); setAmount(""); setDueDate(""); setRecurring("Bulanan");
    }
  }, [open, editing]);

  const submit = () => {
    const a = Number(String(amount).replace(/[^0-9]/g, ''));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, category, amount: a, dueDate, recurring });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Tagihan" : "Tagihan Baru"} C={C}>
      <Field label="Nama Tagihan" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Listrik PLN" style={inputStyle(C)} /></Field>
      <Field label="Proyek" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Kategori" C={C}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
          {CATEGORIES.filter((c) => c.id !== "tabungan").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Jumlah (Rp)" C={C}><input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Jatuh Tempo" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Pengulangan" C={C}>
        <select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>
          {["Bulanan", "Tahunan", "Sekali"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
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
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setLocation(editing.location); setBudget(String(editing.budget)); setManager(editing.manager || ""); setDesc(editing.desc || "");
    } else if (open && !editing) {
      setName(""); setLocation(""); setBudget(""); setManager(""); setDesc("");
    }
  }, [open, editing]);

  const submit = () => {
    const b = Number(String(budget).replace(/[^0-9]/g, ''));
    if (!name || !location || !b) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, location, budget: b, manager, desc });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Proyek" : "Proyek Baru"} C={C}>
      <Field label="Nama Proyek" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Villa Amerta" style={inputStyle(C)} /></Field>
      <Field label="Lokasi" C={C}><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Nusa Dua, Bali" style={inputStyle(C)} /></Field>
      <Field label="Anggaran Bulanan (Rp)" C={C}><input type="text" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Penanggung Jawab" C={C}><input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Nama PJ proyek" style={inputStyle(C)} /></Field>
      <Field label="Deskripsi" C={C}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat proyek" style={inputStyle(C)} /></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Tambah Proyek"}</button>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   ADD DEBT MODAL (HUTANG)
----------------------------------------------------------------*/
function AddDebtModal({ open, onClose, C, projects, editing, onSave }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState("Cicilan Bulanan");
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setProjectId(editing.projectId); setAmount(String(editing.amount));
      setPaidAmount(String(editing.paidAmount ?? 0)); setDueDate(editing.dueDate); setRecurring(editing.recurring);
    } else if (open && !editing) {
      setName(""); setProjectId(projects[0]?.id || ""); setAmount(""); setPaidAmount("0"); setDueDate(""); setRecurring("Cicilan Bulanan");
    }
  }, [open, editing]);

  const submit = () => {
    const a = Number(String(amount).replace(/[^0-9]/g, ''));
    const p = Number(String(paidAmount).replace(/[^0-9]/g, ''));
    if (!name || !a || !dueDate) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, projectId, amount: a, paidAmount: p || 0, dueDate, recurring });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Hutang" : "Hutang Baru"} C={C}>
      <Field label="Nama Hutang / Kreditur" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Pinjaman Bank Modal Kerja" style={inputStyle(C)} /></Field>
      <Field label="Proyek" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Total Hutang (Rp)" C={C}><input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Sudah Dibayar (Rp)" C={C}><input type="text" inputMode="numeric" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Jatuh Tempo / Target Lunas" C={C}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle(C)} /></Field>
      <Field label="Skema" C={C}>
        <select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle(C)}>
          {["Cicilan Bulanan", "Sekali", "Tahunan"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Simpan Hutang"}</button>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   ADD PERSON MODAL (DATA AHLI)
----------------------------------------------------------------*/
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
    if (open && editing) {
      setCategory(editing.category); setProjectId(editing.projectId); setName(editing.name);
      setFatherName(editing.fatherName || ""); setMotherName(editing.motherName || "");
      setBirthPlace(editing.birthPlace || ""); setBirthDate(editing.birthDate || "");
      setSpouseName(editing.spouseName || ""); setChildrenCount(String(editing.childrenCount ?? 0));
    } else if (open && !editing) {
      setCategory("staff-l"); setProjectId(projects[0]?.id || ""); setName("");
      setFatherName(""); setMotherName(""); setBirthPlace(""); setBirthDate(""); setSpouseName(""); setChildrenCount("0");
    }
  }, [open, editing]);

  const isChild = category === "anak";

  const submit = () => {
    const cc = Number(String(childrenCount).replace(/[^0-9]/g, ''));
    if (!name) return;
    onSave({
      ...(isEditing ? { id: editing.id } : {}),
      category, projectId, name,
      fatherName, motherName, birthPlace, birthDate,
      spouseName: isChild ? "" : spouseName,
      childrenCount: isChild ? 0 : cc || 0,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Data Ahli" : "Tambah Data Ahli"} C={C}>
      <Field label="Kategori" C={C}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
          {PEOPLE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Proyek / Kawasan" C={C}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
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
}import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Building2, Receipt, PiggyBank, Bell, BarChart3,
  Plus, Moon, Sun, Cloud, CloudOff, X, TrendingUp, TrendingDown,
  Wallet, Calendar, MapPin, Trash2, AlertTriangle, CheckCircle2,
  Wrench, Zap, Users, Megaphone, Package, FileText, ShoppingBag,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, ChevronDown,
  Landmark, Sparkles, Clock, PlusCircle, LogOut, ShieldCheck, UserCog, Lock, Menu,
  CreditCard, Droplet, Home, HandCoins, Users2, ArrowRightLeft, Baby, User, Pencil, Tag
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from "recharts";

// Menggunakan key "lb_data_v2" untuk mereset paksa data lama pengguna
const STORAGE_KEY = "lb_data_v2";
const loadAppData = async () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
const saveAppData = async (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const subscribeAppData = (cb) => {
  const handler = (e) => {
    if (e.key === STORAGE_KEY) cb(JSON.parse(e.newValue || "null"));
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};
const getSession = () => JSON.parse(localStorage.getItem("lb_session_v2") || "null");
const setSession = (u) => localStorage.setItem("lb_session_v2", JSON.stringify(u));
const clearSession = () => localStorage.removeItem("lb_session_v2");

/* ---------------------------------------------------------------
   TOKENS
----------------------------------------------------------------*/
const FONT_LINK_ID = "lb-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
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

// Semua data diatur kosong sebagai reset awal (Blank Slate)
const seedProjects = () => [];
const seedTransactions = () => [];
const seedGoals = () => [];
const seedBills = () => [];
const seedDebts = () => [];
const seedPeople = () => [];

const DEFAULT_CATEGORIES = [
  { id: "bayar-hutang", label: "Bayar Hutang", icon: CreditCard, color: "#E0B15C", default: true },
  { id: "pdam", label: "PDAM", icon: Droplet, color: "#6FB3D9", default: true },
  { id: "listrik", label: "Listrik", icon: Zap, color: "#C98BD9", default: true },
  { id: "belanja", label: "Belanja", icon: ShoppingBag, color: "#34D8A3", default: true },
  { id: "sewa-rumah", label: "Sewa Rumah", icon: Home, color: "#F0725A", default: true },
  { id: "tabungan", label: "Tabungan", icon: PiggyBank, color: "#5FA8D3", default: true },
];

/* ---------------------------------------------------------------
   HELPERS
----------------------------------------------------------------*/
const fmtIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s) => new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const monthKey = (s) => s.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};
const uid = (p) => p + Math.random().toString(36).slice(2, 9);

function ContourLines({ color = "#34D8A3", opacity = 0.14, className = "" }) {
  const paths = [
    "M-20,120 C 80,60 160,180 260,100 S 420,40 520,110", "M-20,160 C 90,100 170,220 270,140 S 430,80 520,150",
    "M-20,200 C 100,140 180,260 280,180 S 440,120 520,190", "M-20,240 C 110,180 190,300 290,220 S 450,160 520,230",
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
    neutral: { bg: C.surface2, fg: C.textMuted }, jade: { bg: C.jadeSoft, fg: C.jade },
    gold: { bg: C.goldSoft, fg: C.gold }, coral: { bg: C.coralSoft, fg: C.coral },
  };
  const s = map[tone];
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
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.55)", animation: "lbFadeIn .18s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto" style={{ background: C.surface, border: `1px solid ${C.border}`, animation: "lbSlideUp .22s cubic-bezier(.2,.8,.2,1)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "Fraunces, serif" }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
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

const ROLES = [
  { id: "admin", label: "Admin", desc: "Kelola proyek, anggaran, dan hapus data", icon: ShieldCheck },
  { id: "staff", label: "Staff", desc: "Catat transaksi, tagihan, dan tabungan", icon: UserCog },
];

function LoginScreen({ C, onLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const submit = () => { if (name.trim()) onLogin({ name: name.trim(), role }); };
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
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18 }}>Lombok Bali</div>
              <div style={{ fontSize: 11, color: C.textFaint }}>Keuangan Kawasan</div>
            </div>
          </div>
          <div className="text-sm mb-5" style={{ color: C.textMuted }}>Masuk untuk mengakses data keuangan (mode bersih/reset).</div>
          <Field label="Nama Anda" C={C}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Made Wirawan" style={inputStyle(C)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <div className="block mb-2 text-xs font-medium" style={{ color: C.textMuted }}>Peran</div>
          <div className="space-y-2 mb-5">
            {ROLES.map((r) => {
              const Icon = r.icon; const active = role === r.id;
              return (
                <button key={r.id} onClick={() => setRole(r.id)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150" style={{ background: active ? C.jadeSoft : C.surface2, border: `1px solid ${active ? C.jade : C.border}` }}>
                  <Icon size={18} color={active ? C.jade : C.textMuted} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: active ? C.jade : C.text }}>{r.label}</div>
                    <div className="text-xs" style={{ color: C.textFaint }}>{r.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={submit} disabled={!name.trim()} className="w-full py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2" style={{ background: name.trim() ? C.jade : C.surface2, color: name.trim() ? "#08130F" : C.textFaint }}>
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

  const [projects, setProjects] = useState(seedProjects());
  const [transactions, setTransactions] = useState(seedTransactions());
  const [goals, setGoals] = useState(seedGoals());
  const [bills, setBills] = useState(seedBills());
  const [debts, setDebts] = useState(seedDebts());
  const [people, setPeople] = useState(seedPeople());
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [activeProject, setActiveProject] = useState("all");
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState("idle"); 
  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);

  // Modals state
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
        if (data.categories) setCategories(data.categories);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAppData((data) => {
      skipNextSave.current = true;
      if (data.projects) setProjects(data.projects);
      if (data.transactions) setTransactions(data.transactions);
      if (data.goals) setGoals(data.goals);
      if (data.bills) setBills(data.bills);
      if (data.debts) setDebts(data.debts);
      if (data.people) setPeople(data.people);
      if (data.categories) setCategories(data.categories);
      setSyncState("saved");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSyncState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveAppData({ projects, transactions, goals, bills, debts, people, categories });
      setSyncState("saved");
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [projects, transactions, goals, bills, debts, people, categories, loaded]);

  const getCat = (id) => categories.find(c => c.id === id) || categories[categories.length - 1];

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
        if (!map[k]) map[k] = { month: k, Pemasukan: 0, Pengeluaran: 0 };
        if (t.type === "income") map[k].Pemasukan += t.amount;
        else map[k].Pengeluaran += t.amount;
      });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((r) => ({ ...r, label: monthLabel(r.month) }));
  }, [transactions, activeProject]);

  const projectComparison = useMemo(
    () => projects.map((p) => {
        const exp = transactions.filter((t) => t.projectId === p.id && t.type === "expense" && monthKey(t.date) === thisMonthKey).reduce((s, t) => s + t.amount, 0);
        return { name: p.name.split(" ")[0], Anggaran: p.budget, Terpakai: exp };
      }), [projects, transactions, thisMonthKey]
  );

  const upcomingBills = useMemo(() => bills.filter((b) => activeProject === "all" || b.projectId === activeProject).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [bills, activeProject]);
  const scopedGoals = useMemo(() => goals.filter((g) => activeProject === "all" || g.projectId === activeProject || g.projectId === "all"), [goals, activeProject]);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "Kawasan (Semua Proyek)";
  const projectColor = (id) => projects.find((p) => p.id === id)?.color || C.jade;
  const isAdmin = user?.role === "admin";

  if (!userLoaded) return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!user) return <LoginScreen C={C} onLogin={handleLogin} />;

  const NAV = [
    { id: "dashboard", label: "Dasbor", icon: LayoutDashboard },
    { id: "projects", label: "Proyek", icon: Building2 },
    { id: "transactions", label: "Transaksi", icon: Receipt },
    { id: "budget", label: "Anggaran", icon: Wallet },
    { id: "savings", label: "Tabungan", icon: PiggyBank },
    { id: "bills", label: "Tagihan", icon: Bell },
    { id: "debts", label: "Hutang", icon: HandCoins },
    { id: "people", label: "Ahli", icon: Users2 },
    { id: "analytics", label: "Analitik", icon: BarChart3 },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "Inter, sans-serif", minHeight: "100vh", transition: "background .3s ease, color .3s ease" }}>
      <style>{`
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbSlideUp { from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} }
        @keyframes lbFadeUp { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        .lb-anim { animation: lbFadeUp .35s cubic-bezier(.2,.8,.2,1) both; }
        .lb-row:hover { background: ${C.surface2} !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        * { scrollbar-color: ${C.border} transparent; }
      `}</style>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 px-4 py-6" style={{ background: C.bgSoft, borderRight: `1px solid ${C.border}` }}>
          <Brand C={C} />
          <ProjectSwitcher {...{ projects, activeProject, setActiveProject, C }} />
          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((n) => <NavItem key={n.id} n={n} active={tab === n.id} onClick={() => setTab(n.id)} C={C} />)}
          </nav>
          <SyncFooter syncState={syncState} isDark={isDark} setIsDark={setIsDark} C={C} user={user} onLogout={handleLogout} />
        </aside>

        {/* MOBILE TOP BAR */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <IconBtn C={C} onClick={() => setMobileNav(true)}><Menu size={16} /></IconBtn>
            <Brand C={C} compact />
          </div>
          <IconBtn C={C} onClick={() => setIsDark((d) => !d)}>{isDark ? <Sun size={16} /> : <Moon size={16} />}</IconBtn>
        </div>

        {/* MOBILE SLIDE-IN SIDEBAR */}
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

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 md:py-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
          {tab === "dashboard" && <Dashboard {...{ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people, getCat }} />}
          {tab === "projects" && <ProjectsView {...{ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin }} />}
          {tab === "transactions" && <TransactionsView {...{ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin, categories, getCat, onManageCat: () => setCatModal(true) }} />}
          {tab === "budget" && <BudgetView {...{ C, projects, transactions, thisMonthKey, categories }} />}
          {tab === "savings" && <SavingsView {...{ C, goals, setGoals, projects, projectName, setGoalModal, isAdmin }} />}
          {tab === "bills" && <BillsView {...{ C, bills, setBills, projects, projectName, setBillModal, isAdmin, getCat }} />}
          {tab === "debts" && <DebtsView {...{ C, debts, setDebts, projects, projectName, setDebtModal, isAdmin }} />}
          {tab === "people" && <PeopleView {...{ C, people, setPeople, projects, projectName, setPersonModal, isAdmin }} />}
          {tab === "analytics" && <AnalyticsView {...{ C, categoryBreakdown, monthlyTrend, projectComparison, totals }} />}
        </main>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button onClick={() => setTxModal("new")} className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: C.jade, color: "#08130F", fontWeight: 600, boxShadow: `0 8px 24px ${C.jadeSoft}` }}>
        <Plus size={18} /> <span className="hidden sm:inline">Transaksi</span>
      </button>

      {}
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
      <AddProjectModal open={!!projModal} editing={projModal && projModal !== "new" ? projModal : null} onClose={() => setProjModal(null)} C={C} onSave={(data) => { if (data.id) setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))); else setProjects((prev) => [...prev, { id: uid("p"), color: PROJECT_COLORS[prev.length % PROJECT_COLORS.length], ...data }]); }} />
    </div>
  );
}

/* ---------------------------------------------------------------
   NAV PIECES
----------------------------------------------------------------*/
function Brand({ C, compact }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${C.jade}, ${C.blue})` }}>
        <Landmark size={18} color="#08130F" />
      </div>
      {!compact && (
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, lineHeight: 1 }}>Lombok Bali</div>
          <div style={{ fontSize: 11, color: C.textFaint, letterSpacing: 0.3 }}>Keuangan Kawasan</div>
        </div>
      )}
      {compact && <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Lombok Bali</div>}
    </div>
  );
}

function ProjectSwitcher({ projects, activeProject, setActiveProject, C }) {
  return (
    <div className="mt-6">
      <div className="text-xs font-medium mb-2 px-1" style={{ color: C.textFaint }}>KAWASAN</div>
      <button onClick={() => setActiveProject("all")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-sm transition-all duration-150" style={{ background: activeProject === "all" ? C.jadeSoft : "transparent", color: activeProject === "all" ? C.jade : C.textMuted, fontWeight: activeProject === "all" ? 600 : 500 }}>
        <Sparkles size={15} /> Semua Proyek
      </button>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {projects.length === 0 && <div className="px-3 text-xs" style={{color: C.textFaint}}>Belum ada proyek</div>}
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
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs capitalize" style={{ color: C.textFaint }}>{user.role === "admin" ? "Admin" : "Staff"}</div>
          </div>
          <button onClick={onLogout} title="Keluar" className="p-1.5 rounded-md transition-transform duration-150 hover:scale-110" style={{ color: C.textFaint }}><LogOut size={15} /></button>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.textFaint }}>
          {syncState === "saving" ? <Cloud size={14} className="animate-pulse" /> : <Cloud size={14} style={{ color: C.jade }} />}
          {syncState === "saving" ? "Menyimpan…" : "Tersimpan di browser"}
        </div>
      </div>
      <button onClick={() => setIsDark((d) => !d)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200" style={{ background: C.surface2, color: C.textMuted, border: `1px solid ${C.border}` }}>
        {isDark ? <Sun size={15} /> : <Moon size={15} />} {isDark ? "Mode Terang" : "Mode Gelap"}
      </button>
    </div>
  );
}

function Dashboard({ C, isDark, projects, totals, monthSpend, monthBudget, categoryBreakdown, monthlyTrend, upcomingBills, scopedTx, activeProject, projectName, projectColor, setTab, setTxModal, people, getCat }) {
  const budgetPct = monthBudget ? (monthSpend / monthBudget) * 100 : 0;
  const recent = scopedTx.slice(0, 5);
  const dueSoon = upcomingBills.filter((b) => b.paidAmount < b.amount).slice(0, 4);

  return (
    <div className="space-y-6 lb-anim">
      {people && people.length > 0 && (
        <Card C={C} pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Data Ahli</h3>
            <button onClick={() => setTab("people")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="grid grid-cols-3 gap-4 px-5 pb-5">
            {[{ key: "staff-l", label: "Staff L", icon: User }, { key: "staff-p", label: "Staff P", icon: User }, { key: "anak", label: "Anak", icon: Baby }].map((g) => {
              const Icon = g.icon; const count = people.filter((p) => p.category === g.key).length;
              return (
                <div key={g.key} className="rounded-xl p-3.5" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                  <Icon size={16} color={C.jade} />
                  <div className="text-xl font-bold mt-2" style={{ fontFamily: "Fraunces, serif" }}>{count}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{g.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-9" style={{ background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`, border: `1px solid ${C.border}` }}>
        <ContourLines color={C.jade} opacity={isDark ? 0.16 : 0.09} />
        <div className="relative">
          <div className="text-xs font-medium tracking-wide mb-2" style={{ color: C.textFaint }}>
            {activeProject === "all" ? "SELURUH KAWASAN" : projectName(activeProject).toUpperCase()}
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>Saldo Bersih</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 32, fontWeight: 600, color: totals.balance >= 0 ? C.jade : C.coral }}>{fmtIDR(totals.balance)}</div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowUpRight size={14} color={C.jade} /> Pemasukan</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600 }}>{fmtIDR(totals.income)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5" style={{ color: C.textMuted, fontSize: 13 }}><ArrowDownRight size={14} color={C.coral} /> Pengeluaran</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 600 }}>{fmtIDR(totals.expense)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Proyek Aktif</span><Building2 size={16} color={C.jade} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{projects.length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Anggaran Bulan Ini</span><Wallet size={16} color={C.gold} /></div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(monthBudget)}</div>
          <div className="mt-2"><ProgressBar pct={budgetPct} color={budgetPct > 90 ? C.coral : C.jade} C={C} /></div>
          <div className="text-xs mt-1" style={{ color: C.textFaint }}>{budgetPct.toFixed(0)}% terpakai</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Tagihan Menunggu</span><Bell size={16} color={C.coral} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{upcomingBills.filter((b) => b.paidAmount < b.amount).length}</div>
        </Card>
        <Card C={C} className="lb-anim">
          <div className="flex items-center justify-between mb-2"><span style={{ color: C.textMuted, fontSize: 13 }}>Transaksi</span><Receipt size={16} color={C.blue} /></div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>{scopedTx.length}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card C={C} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Tren Bulanan</h3>
            <Badge C={C} tone="jade"><TrendingUp size={12} /> 6 bulan</Badge>
          </div>
          {monthlyTrend.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textFaint }}>Belum ada data tren</div> :
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Line type="monotone" dataKey="Pemasukan" stroke={C.jade} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke={C.coral} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          }
        </Card>
        <Card C={C} className="lg:col-span-2">
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Pengeluaran per Kategori</h3>
          {categoryBreakdown.length === 0 ? <div className="text-sm py-10 text-center" style={{ color: C.textFaint }}>Belum ada data</div> :
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={45} outerRadius={68} paddingAngle={3}>
                    {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryBreakdown.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          }
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card C={C} className="lg:col-span-3" pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Transaksi Terbaru</h3>
            <button onClick={() => setTab("transactions")} className="text-xs font-medium" style={{ color: C.jade }}>Lihat semua</button>
          </div>
          <div>
            {recent.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textFaint }}>Belum ada transaksi.</div>}
            {recent.map((t) => {
              const cat = getCat(t.category);
              const Icon = cat.icon || Tag;
              return (
                <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                    {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.note}</div>
                    <div className="text-xs" style={{ color: C.textFaint }}>{projectName(t.projectId)} · {fmtDate(t.date)}</div>
                  </div>
                  <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                    {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card C={C} className="lg:col-span-2" pad="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Tagihan Mendatang</h3>
            <button onClick={() => setTab("bills")} className="text-xs font-medium" style={{ color: C.jade }}>Kelola</button>
          </div>
          <div className="pb-3">
            {dueSoon.length === 0 && <div className="px-5 pb-5 text-sm" style={{ color: C.textFaint }}>Semua tagihan aman 🎉</div>}
            {dueSoon.map((b) => {
              const overdue = new Date(b.dueDate) < new Date(new Date().toDateString());
              return (
                <div key={b.id} className="lb-row flex items-center gap-3 px-5 py-3 transition-colors duration-150" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: overdue ? C.coralSoft : C.goldSoft }}>
                    {overdue ? <AlertTriangle size={15} color={C.coral} /> : <Clock size={15} color={C.gold} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs" style={{ color: overdue ? C.coral : C.textFaint }}>{projectName(b.projectId)} · {fmtDate(b.dueDate)}</div>
                  </div>
                  <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(b.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProjectsView({ C, projects, transactions, setActiveProject, setTab, setProjModal, isAdmin }) {
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Profil Proyek" subtitle="Semua kawasan pengembangan yang sedang berjalan" action={isAdmin ? { label: "Tambah Proyek", onClick: () => setProjModal("new") } : null} />
      {projects.length === 0 && <div className="text-sm" style={{color: C.textFaint}}>Belum ada data proyek.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const tx = transactions.filter((t) => t.projectId === p.id);
          const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          return (
            <Card key={p.id} C={C} pad="p-0" className="overflow-hidden group cursor-pointer transition-transform duration-200 hover:-translate-y-1" style={{ position: "relative" }}>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); setProjModal(p); }} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-transform duration-150 hover:scale-110" style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }} title="Edit proyek"><Pencil size={13} /></button>
              )}
              <div onClick={() => { setActiveProject(p.id); setTab("dashboard"); }}>
                <div className="relative h-20 flex items-end p-4" style={{ background: `linear-gradient(135deg, ${p.color}30, ${p.color}08)` }}>
                  <ContourLines color={p.color} opacity={0.3} />
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.color }}><Building2 size={18} color="#08130F" /></div>
                </div>
                <div className="p-4">
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 17 }}>{p.name}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5 mb-3" style={{ color: C.textFaint }}><MapPin size={11} />{p.location}</div>
                  <p className="text-xs mb-4" style={{ color: C.textMuted, lineHeight: 1.5 }}>{p.desc}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <div style={{ color: C.textFaint }}>Pemasukan</div>
                      <div className="font-semibold" style={{ color: C.jade, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(income)}</div>
                    </div>
                    <div>
                      <div style={{ color: C.textFaint }}>Pengeluaran</div>
                      <div className="font-semibold" style={{ color: C.coral, fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</div>
                    </div>
                  </div>
                  <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textFaint }}>
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

function TransactionsView({ C, transactions, projects, activeProject, projectName, projectColor, setTxModal, setTransactions, isAdmin, categories, getCat, onManageCat }) {
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
             <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.textFaint} />
             <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." style={{ ...inputStyle(C), paddingLeft: 34 }} />
           </div>
           <button onClick={onManageCat} className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}>
             <Tag size={15}/> <span className="hidden sm:inline">Kategori</span>
           </button>
        </div>
      </div>

      <Card C={C} pad="p-0">
        {rows.length === 0 && <div className="p-8 text-center text-sm" style={{ color: C.textFaint }}>Tidak ada transaksi ditemukan.</div>}
        {rows.map((t, i) => {
          const cat = getCat(t.category);
          const Icon = cat.icon || Tag;
          return (
            <div key={t.id} className="lb-row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.borderSoft}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.jadeSoft : `${cat.color}22` }}>
                {t.type === "income" ? <TrendingUp size={15} color={C.jade} /> : <Icon size={15} color={cat.color} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.note}</div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: C.textFaint }}>
                  <span style={{ color: projectColor(t.projectId) }}>●</span> {projectName(t.projectId)} · {fmtDate(t.date)} · {t.type === "expense" ? cat.label : "Pemasukan"}
                </div>
              </div>
              <div className="text-sm font-semibold shrink-0" style={{ fontFamily: "JetBrains Mono, monospace", color: t.type === "income" ? C.jade : C.text }}>
                {t.type === "income" ? "+" : "-"}{fmtIDR(t.amount)}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setTxModal(t)} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textFaint }} title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))} className="p-1.5 rounded-md transition-opacity" style={{ color: C.textFaint }} title="Hapus"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function BudgetView({ C, projects, transactions, thisMonthKey, categories }) {
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Anggaran Bulanan" subtitle={`Realisasi vs anggaran untuk ${monthLabel(thisMonthKey)}`} />
      {projects.length === 0 && <div className="text-sm" style={{color: C.textFaint}}>Belum ada data proyek.</div>}
      <div className="grid lg:grid-cols-2 gap-5">
        {projects.map((p) => {
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
                  <span className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{p.name}</span>
                </div>
                <Badge C={C} tone={pct > 90 ? "coral" : pct > 70 ? "gold" : "jade"}>{pct.toFixed(0)}%</Badge>
              </div>
              <div className="flex items-baseline justify-between text-sm mb-2" style={{ color: C.textMuted }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(spent)}</span><span>dari {fmtIDR(p.budget)}</span>
              </div>
              <ProgressBar pct={pct} color={pct > 90 ? C.coral : pct > 70 ? C.gold : C.jade} C={C} height={10} />
              <div className="mt-4 space-y-2.5">
                {catRows.length === 0 && <div className="text-xs" style={{ color: C.textFaint }}>Belum ada pengeluaran bulan ini.</div>}
                {catRows.map((c) => {
                  const Icon = c.icon || Tag;
                  const catPct = p.budget ? (c.value / p.budget) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><Icon size={12} color={c.color} />{c.label}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtIDR(c.value)}</span>
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

function SavingsView({ C, goals, setGoals, projects, projectName, setGoalModal, isAdmin }) {
  const addFunds = (id) => {
    // Meminta nilai nominal tabungan dalam string
    const amtStr = prompt("Tambah dana tabungan (Rp):");
    if (!amtStr) return;
    const n = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!n || n <= 0) return;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current: g.current + n } : g)));
  };
  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Target Tabungan" subtitle="Rencana dana jangka panjang kawasan" action={isAdmin ? { label: "Tambah Target", onClick: () => setGoalModal("new") } : null} />
      {goals.length === 0 && <div className="text-sm" style={{color: C.textFaint}}>Belum ada data tabungan.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {goals.map((g) => {
          const pct = g.target ? (g.current / g.target) * 100 : 0;
          const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
          return (
            <Card key={g.id} C={C} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{g.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(g.projectId === "all" ? undefined : g.projectId) || "Seluruh Kawasan"}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setGoalModal(g)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}><PiggyBank size={17} color={C.jade} /></div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(g.current)}</span><span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(g.target)}</span>
              </div>
              <ProgressBar pct={pct} color={C.jade} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% tercapai</span><span className="flex items-center gap-1"><Calendar size={11} />{daysLeft > 0 ? `${daysLeft} hari lagi` : "Jatuh tempo"}</span>
              </div>
              <button onClick={() => addFunds(g.id)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.jade, border: `1px solid ${C.border}` }}>
                <PlusCircle size={14} /> Tambah Dana
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BillsView({ C, bills, setBills, projects, projectName, setBillModal, isAdmin, getCat }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const addPayment = (id) => {
    const bill = bills.find((b) => b.id === id);
    const amtStr = prompt(`Tambah pembayaran untuk "${bill?.name}" (Rp):`);
    if(!amtStr) return;
    const amt = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) return;
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidAmount: Math.min(b.amount, b.paidAmount + amt) } : b)));
  };
  const markFullyPaid = (id) => setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidAmount: b.amount } : b)));

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Pengingat Tagihan" subtitle="Lacak progres pembayaran hingga tagihan lunas" action={isAdmin ? { label: "Tambah Tagihan", onClick: () => setBillModal("new") } : null} />
      {sorted.length === 0 && <div className="text-sm" style={{color: C.textFaint}}>Belum ada data tagihan.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map((b) => {
          const cat = getCat(b.category || "belanja");
          const CatIcon = cat.icon || Tag;
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
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{b.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(b.projectId)} · {b.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setBillModal(b)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : `${cat.color}22` }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <CatIcon size={17} color={cat.color} />}
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(b.paidAmount)}</span><span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(b.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% terbayar</span><span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>
              <div className="mt-2"><Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>{isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}</Badge></div>
              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => addPayment(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}><PlusCircle size={14} /> Bayar</button>
                  <button onClick={() => markFullyPaid(b.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}><CheckCircle2 size={14} /></button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DebtsView({ C, debts, setDebts, projects, projectName, setDebtModal, isAdmin }) {
  const today = new Date(new Date().toDateString());
  const sorted = [...debts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const addPayment = (id) => {
    const debt = debts.find((d) => d.id === id);
    const amtStr = prompt(`Tambah cicilan untuk "${debt?.name}" (Rp):`);
    if(!amtStr) return;
    const amt = Number(amtStr.replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) return;
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paidAmount: Math.min(d.amount, d.paidAmount + amt) } : d)));
  };
  const markFullyPaid = (id) => setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paidAmount: d.amount } : d)));

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Hutang" subtitle="Lacak progres pelunasan hutang & pinjaman kawasan" action={isAdmin ? { label: "Tambah Hutang", onClick: () => setDebtModal("new") } : null} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.length === 0 && <div className="text-sm py-6" style={{ color: C.textFaint }}>Belum ada data hutang.</div>}
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
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{d.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(d.projectId)} · {d.recurring}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && <button onClick={() => setDebtModal(d)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isPaid ? C.jadeSoft : overdue ? C.coralSoft : soon ? C.goldSoft : C.goldSoft }}>
                    {isPaid ? <CheckCircle2 size={17} color={C.jade} /> : overdue ? <AlertTriangle size={17} color={C.coral} /> : <HandCoins size={17} color={C.gold} />}
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700 }}>{fmtIDR(d.paidAmount)}</span><span className="text-xs" style={{ color: C.textFaint }}>/ {fmtIDR(d.amount)}</span>
              </div>
              <ProgressBar pct={pct} color={isPaid ? C.jade : overdue ? C.coral : C.gold} C={C} height={9} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.textFaint }}>
                <span>{pct.toFixed(0)}% terlunasi</span><span className="flex items-center gap-1"><Calendar size={11} />{isPaid ? "Lunas" : daysLeft >= 0 ? `${daysLeft} hari lagi` : `Terlambat ${Math.abs(daysLeft)} hari`}</span>
              </div>
              <div className="mt-2"><Badge C={C} tone={isPaid ? "jade" : overdue ? "coral" : soon ? "gold" : "neutral"}>{isPaid ? "Lunas" : overdue ? "Terlambat" : soon ? "Segera Jatuh Tempo" : "Belum Lunas"}</Badge></div>
              {!isPaid && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => addPayment(d.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.surface2, color: C.gold, border: `1px solid ${C.border}` }}><PlusCircle size={14} /> Cicil</button>
                  <button onClick={() => markFullyPaid(d.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}` }}><CheckCircle2 size={14} /></button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const PEOPLE_CATEGORIES = [{ id: "staff-l", label: "Staff Laki-laki" }, { id: "staff-p", label: "Staff Perempuan" }, { id: "anak", label: "Anak" }];
const peopleCatLabel = (id) => PEOPLE_CATEGORIES.find((c) => c.id === id)?.label || id;

function PeopleView({ C, people, setPeople, projects, projectName, setPersonModal, isAdmin }) {
  const [filter, setFilter] = useState("all");
  const rows = people.filter((p) => filter === "all" || p.category === filter);

  return (
    <div className="space-y-5 lb-anim">
      <ViewHeader C={C} title="Data Ahli" subtitle="Data staff (laki-laki/perempuan) dan anak-anak di kawasan" action={isAdmin ? { label: "Tambah Data", onClick: () => setPersonModal("new") } : null} />
      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "Semua" }, ...PEOPLE_CATEGORIES].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150" style={{ background: filter === f.id ? C.jadeSoft : C.surface2, color: filter === f.id ? C.jade : C.textMuted, border: `1px solid ${C.border}` }}>{f.label}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows.length === 0 && <div className="text-sm py-6" style={{ color: C.textFaint }}>Belum ada data.</div>}
        {rows.map((p) => (
          <Card key={p.id} C={C}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{projectName(p.projectId)}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin && <button onClick={() => setPersonModal(p)} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110" style={{ background: C.surface2, color: C.textMuted }} title="Edit"><Pencil size={13} /></button>}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.jadeSoft }}>{p.category === "anak" ? <Baby size={17} color={C.jade} /> : <User size={17} color={C.jade} />}</div>
              </div>
            </div>
            <Badge C={C} tone="jade">{peopleCatLabel(p.category)}</Badge>
            <div className="mt-3 space-y-1.5 text-xs" style={{ color: C.textMuted }}>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Ayah</span><span>{p.fatherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Ibu</span><span>{p.motherName || "-"}</span></div>
              <div className="flex justify-between"><span style={{ color: C.textFaint }}>Tempat, Tgl Lahir</span><span>{p.birthPlace}{p.birthDate ? `, ${fmtDate(p.birthDate)}` : ""}</span></div>
              {p.category !== "anak" && (
                <>
                  <div className="flex justify-between"><span style={{ color: C.textFaint }}>Nama Istri/Suami</span><span>{p.spouseName || "-"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textFaint }}>Jumlah Anak</span><span>{p.childrenCount ?? 0}</span></div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView({ C, categoryBreakdown, monthlyTrend, projectComparison, totals }) {
  return (
    <div className="space-y-6 lb-anim">
      <ViewHeader C={C} title="Analitik Keuangan" subtitle="Wawasan menyeluruh atas kinerja keuangan kawasan" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Anggaran vs Realisasi per Proyek</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={projectComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Anggaran" fill={C.blue} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Terpakai" fill={C.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card C={C}>
          <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Komposisi Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card C={C}>
        <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>Arus Kas Bulanan</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="label" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
            <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtIDR(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pemasukan" fill={C.jade} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill={C.coral} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ViewHeader({ C, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24 }}>{title}</h2>
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
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Modal open={open} onClose={onClose} title="Kelola Kategori" C={C}>
      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
        {categories.map(c => {
          const CatIcon = c.icon || Tag;
          return (
            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{background: C.surface2, border: `1px solid ${C.border}`}}>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{background: `${c.color}22`}}>
                  <CatIcon size={12} color={c.color} />
                </div>
                {c.label}
              </div>
              {!c.default && (
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-black/10" style={{color: C.coral}} title="Hapus">
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div style={{borderTop: `1px solid ${C.border}`}} className="pt-4">
         <Field label="Nama Kategori Baru" C={C}>
           <input value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle(C)} placeholder="Contoh: Transportasi" />
         </Field>
         <Field label="Pilih Warna" C={C}>
           <div className="flex flex-wrap gap-2">
             {PROJECT_COLORS.map(col => (
               <button key={col} onClick={() => setColor(col)} className="w-8 h-8 rounded-full border-2 transition-all" style={{background: col, borderColor: color === col ? C.text : 'transparent'}} />
             ))}
           </div>
         </Field>
         <button onClick={handleAdd} className="w-full mt-2 py-2.5 rounded-lg font-medium transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jadeSoft, color: C.jade, border: `1px solid ${C.border}`}}>
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
    // Membaca nominal tanpa menghilangkan nol, hanya buang karakter selain angka
    const rawVal = String(amount).replace(/[^0-9]/g, ''); 
    const amt = Number(rawVal);
    if (!amt || amt <= 0) return;

    if (isEditing) {
      if (!note || !projectId) return;
      onEditTransaction(editing.id, { type, projectId, category: type === "income" ? "belanja" : category, amount: amt, date, note });
      onClose(); return;
    }

    if (type === "goal") {
      const g = goals.find((x) => x.id === goalId); if (!g) return;
      onAddTransaction({ type: "expense", projectId: g.projectId === "all" ? (projects[0]?.id || "") : g.projectId, category: "tabungan", amount: amt, date, note: note || `Setor ke tabungan: ${g.name}` });
      onContributeGoal(goalId, amt);
    } else if (type === "debt") {
      const d = (debts || []).find((x) => x.id === debtId); if (!d) return;
      onAddTransaction({ type: "expense", projectId: d.projectId, category: "bayar-hutang", amount: amt, date, note: note || `Cicilan hutang: ${d.name}` });
      onPayDebt(debtId, amt);
    } else {
      if (!note || !projectId) return;
      onAddTransaction({ type, projectId, category: type === "income" ? "belanja" : category, amount: amt, date, note });
    }
    onClose();
  };

  // Hapus opsi Bayar Tagihan (bill)
  const ALL_TYPES = [ { id: "expense", label: "Pengeluaran" }, { id: "income", label: "Pemasukan" }, { id: "goal", label: "Ke Tabungan" }, { id: "debt", label: "Bayar Hutang" }];
  const TYPES = isEditing ? ALL_TYPES.filter((t) => t.id === "expense" || t.id === "income") : ALL_TYPES;
  const typeColor = (tp) => (tp === "income" ? C.jade : tp === "goal" ? C.blue : tp === "debt" ? C.gold : C.coral);

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"} C={C}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TYPES.map((tp) => (
          <button key={tp.id} onClick={() => setType(tp.id)} className="py-2 rounded-lg text-sm font-medium transition-all duration-150" style={{ background: type === tp.id ? `${typeColor(tp.id)}22` : C.surface2, color: type === tp.id ? typeColor(tp.id) : C.textMuted }}>{tp.label}</button>
        ))}
      </div>
      {(type === "expense" || type === "income") && (
        <>
          <Field label="Proyek" C={C}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>
              {projects.length === 0 && <option value="">(Buat proyek dulu)</option>}
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {type === "expense" && (
            <Field label="Kategori" C={C}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>
                {categories.filter((c) => c.id !== "tabungan").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          )}
        </>
      )}
      {type === "goal" && !isEditing && (
        <Field label="Target Tabungan" C={C}>
          {goals.length === 0 ? <div className="text-xs py-2" style={{ color: C.textFaint }}>Belum ada target tabungan.</div> : (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={inputStyle(C)}>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name} ({fmtIDR(g.current)} / {fmtIDR(g.target)})</option>)}
            </select>
          )}
        </Field>
      )}
      {type === "debt" && !isEditing && (
        <Field label="Hutang" C={C}>
          {(!debts || debts.length === 0) ? <div className="text-xs py-2" style={{ color: C.textFaint }}>Belum ada data hutang.</div> : (
            <>
              <select value={debtId} onChange={(e) => setDebtId(e.target.value)} style={inputStyle(C)}>
                {debts.map((d) => <option key={d.id} value={d.id}>{d.name} (sisa {fmtIDR(Math.max(0, d.amount - d.paidAmount))})</option>)}
              </select>
              {selectedDebt && <div className="text-xs mt-1.5" style={{ color: C.textFaint }}>Sisa hutang: {fmtIDR(remainingDebt)}</div>}
            </>
          )}
        </Field>
      )}

      {/* Input nominal kini tetap string angka utuh sebelum disubmit (aman untuk nilai kecil seperti 10.000) */}
      <Field label="Jumlah (Rp)" C={C}><input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
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
      <Field label="Proyek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}><option value="all">Seluruh Kawasan</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Target Dana (Rp)" C={C}><input type="text" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
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
      <Field label="Proyek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length===0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Kategori" C={C}><select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(C)}>{categories.filter((c) => c.id !== "tabungan").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
      <Field label="Jumlah (Rp)" C={C}><input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
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
  const isEditing = !!editing;

  useEffect(() => {
    if (open && editing) { setName(editing.name); setLocation(editing.location); setBudget(String(editing.budget)); setManager(editing.manager || ""); setDesc(editing.desc || ""); } 
    else if (open && !editing) { setName(""); setLocation(""); setBudget(""); setManager(""); setDesc(""); }
  }, [open, editing]);

  const submit = () => {
    const b = Number(String(budget).replace(/[^0-9]/g, ''));
    if (!name || !location || !b) return;
    onSave({ ...(isEditing ? { id: editing.id } : {}), name, location, budget: b, manager, desc }); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Proyek" : "Proyek Baru"} C={C}>
      <Field label="Nama Proyek" C={C}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Villa Amerta" style={inputStyle(C)} /></Field>
      <Field label="Lokasi" C={C}><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Nusa Dua, Bali" style={inputStyle(C)} /></Field>
      <Field label="Anggaran Bulanan (Rp)" C={C}><input type="text" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Penanggung Jawab" C={C}><input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Nama PJ proyek" style={inputStyle(C)} /></Field>
      <Field label="Deskripsi" C={C}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat proyek" style={inputStyle(C)} /></Field>
      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium mt-2 transition-transform duration-150 hover:scale-[1.01] active:scale-95" style={{ background: C.jade, color: "#08130F" }}>{isEditing ? "Simpan Perubahan" : "Tambah Proyek"}</button>
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
      <Field label="Proyek" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length===0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Total Hutang (Rp)" C={C}><input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
      <Field label="Sudah Dibayar (Rp)" C={C}><input type="text" inputMode="numeric" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={inputStyle(C)} /></Field>
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
      <Field label="Proyek / Kawasan" C={C}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle(C)}>{projects.length===0 && <option value="">(Kosong)</option>}{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
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