# Lombok Bali — Keuangan Kawasan

Aplikasi manajemen keuangan kawasan untuk beberapa proyek (Villa Kayangan, Senggigi Bay Resort, Canggu Beach Club, Gili Eco Retreat), dengan data yang tersinkron real-time ke semua pengguna lewat Supabase.

## 1. Siapkan Supabase (gratis)

1. Buat akun & project baru di [supabase.com](https://supabase.com) (gratis, tanpa kartu kredit).
2. Buka **SQL Editor** di dashboard Supabase, tempel isi file `supabase-setup.sql` dari folder ini, lalu klik **Run**. Ini membuat tabel `app_data` tempat semua data (proyek, transaksi, anggaran, tabungan, tagihan) disimpan.
3. Buka **Project Settings → API**, salin:
   - `Project URL`
   - `anon public` key

## 2. Jalankan di komputer Anda

```bash
npm install
cp .env.example .env
```

Buka file `.env`, isi dengan URL & anon key dari langkah 1:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxx
```

Lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173` — aplikasi seharusnya jalan dan tersambung ke Supabase.

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Lombok Bali finance app"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

> Ganti `USERNAME/NAMA-REPO` dengan repository GitHub Anda. **Jangan** commit file `.env` — sudah otomatis diabaikan lewat `.gitignore`.

## 4. Deploy ke GitHub Pages (otomatis, bisa diakses semua orang)

1. Di repo GitHub, buka **Settings → Pages**, pada bagian **Source** pilih **GitHub Actions**.
2. Buka **Settings → Secrets and variables → Actions**, tambahkan 2 secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (isi sama seperti di file `.env` Anda)
3. Buka `vite.config.js`, ubah baris `base: "/lombok-bali-finance/"` menjadi sesuai **nama repo** Anda persis, contoh: `base: "/nama-repo-saya/"`.
4. Commit & push perubahan itu ke branch `main`.
5. Workflow di `.github/workflows/deploy.yml` akan otomatis build & deploy setiap kali Anda push ke `main`. Cek progresnya di tab **Actions**.
6. Setelah selesai (±1-2 menit), aplikasi bisa diakses semua orang di:
   `https://USERNAME.github.io/NAMA-REPO/`

## Bagaimana kolaborasi bekerja

- Semua orang yang membuka link tersebut melihat **data yang sama**, tersinkron real-time lewat Supabase Realtime — kalau satu orang menambah transaksi, yang lain langsung melihatnya tanpa refresh.
- Saat pertama membuka aplikasi, setiap pengguna memilih nama + peran (**Admin** atau **Staff**). Admin bisa mengelola proyek/anggaran dan menghapus data; Staff hanya mencatat transaksi, tagihan, dan tabungan.
- **Catatan keamanan**: karena tabel Supabase diatur akses publik (tanpa login server), siapa pun yang tahu URL aplikasi bisa membaca & mengubah data — cocok untuk tool internal tim tepercaya, bukan untuk data sangat sensitif. Kalau butuh proteksi lebih (login dengan password sungguhan per orang), Supabase Auth bisa ditambahkan belakangan.

## Struktur Proyek

```
├── src/
│   ├── App.jsx              # Seluruh UI & logika aplikasi
│   ├── main.jsx              # Entry point React
│   ├── index.css             # Tailwind CSS
│   └── lib/
│       ├── supabaseClient.js # Koneksi ke Supabase
│       └── storage.js        # Load/save/realtime data + sesi login lokal
├── supabase-setup.sql        # Jalankan sekali di Supabase SQL Editor
├── .github/workflows/deploy.yml  # Auto-deploy ke GitHub Pages
└── vite.config.js
```
