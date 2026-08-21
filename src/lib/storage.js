import { supabase } from "./supabaseClient";

// Semua data kawasan disimpan sebagai satu baris JSON di tabel `app_data`.
// Ini setara dengan window.storage(shared=true) di artifact Claude, tapi
// sekarang benar-benar tersinkron lewat Supabase (Postgres + Realtime).
const ROW_ID = 1;

export async function loadAppData() {
  const { data, error } = await supabase
    .from("app_data")
    .select("payload")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) {
    console.error("Gagal memuat data dari Supabase:", error.message);
    return null;
  }
  return data?.payload || null;
}

export async function saveAppData(payload) {
  const { error } = await supabase
    .from("app_data")
    .upsert({ id: ROW_ID, payload, updated_at: new Date().toISOString() });
  if (error) console.error("Gagal menyimpan data ke Supabase:", error.message);
}

// Dengarkan perubahan data dari perangkat/pengguna lain secara real-time.
export function subscribeAppData(onChange) {
  const channel = supabase
    .channel("app_data_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_data", filter: `id=eq.${ROW_ID}` },
      (payload) => {
        if (payload.new?.payload) onChange(payload.new.payload);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// Sesi login (nama + peran) — cukup disimpan lokal per perangkat, tidak perlu shared.
const SESSION_KEY = "lombok-bali-session";
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
