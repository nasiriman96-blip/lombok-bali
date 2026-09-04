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

/* -----------------------------------------------------------------
   AUTENTIKASI SUNGGUHAN (Supabase Auth)
   Username diubah jadi format email internal (username@lombokbali.app)
   di balik layar, supaya tetap dipakai dengan username biasa. Password
   diverifikasi & disimpan terenkripsi di server Supabase — bukan lagi
   tertulis di kode aplikasi.
------------------------------------------------------------------*/
const EMAIL_DOMAIN = "lombokbali.app";
const usernameToEmail = (username) => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

// Login. Return { user: {name, role} } kalau sukses, atau { error } kalau gagal.
export async function signIn(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) return { error: "Username atau password salah." };
  const meta = data.user?.user_metadata || {};
  return { user: { name: meta.display_name || username, role: meta.role === "admin" ? "admin" : "staff" } };
}

export async function signOutUser() {
  await supabase.auth.signOut();
}

// Ambil sesi login yang masih aktif (kalau sebelumnya sudah login & belum expired).
// Supabase otomatis menyimpan & me-refresh token sesi ini sendiri, kita tinggal baca.
export async function getActiveUser() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session) return null;
  const meta = session.user?.user_metadata || {};
  return { name: meta.display_name || session.user.email.split("@")[0], role: meta.role === "admin" ? "admin" : "staff" };
}

// Dengarkan perubahan status login (misal token expired / logout dari tab lain).
export function subscribeAuth(onChange) {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) { onChange(null); return; }
    const meta = session.user?.user_metadata || {};
    onChange({ name: meta.display_name || session.user.email.split("@")[0], role: meta.role === "admin" ? "admin" : "staff" });
  });
  return () => listener.subscription.unsubscribe();
}

