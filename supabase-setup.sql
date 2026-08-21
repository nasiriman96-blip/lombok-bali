-- Jalankan script ini di Supabase Dashboard > SQL Editor > New query > Run

create table if not exists app_data (
  id int primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- Izinkan akses publik baca & tulis (cocok untuk tool internal tim tanpa login server).
-- Kalau ingin lebih aman nanti, ini bisa diganti dengan Supabase Auth + policy per user.
alter table app_data enable row level security;

create policy "Public read access"
  on app_data for select
  using (true);

create policy "Public write access"
  on app_data for insert
  with check (true);

create policy "Public update access"
  on app_data for update
  using (true);

-- Aktifkan Realtime supaya perubahan data langsung tersinkron ke semua pengguna lain.
alter publication supabase_realtime add table app_data;
