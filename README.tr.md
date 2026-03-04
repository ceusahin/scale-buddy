# Arkadaşlarını Ölç

Gerçek zamanlı çok oyunculu bir tarayıcı oyunu.

**Detaylı Türkçe kurulum rehberi:** [KURULUM.tr.md](./KURULUM.tr.md)

Lobi oluştur, arkadaşlarını 5 harfli kodla davet et, 10 soruda grupta soruya en çok kimin uyduğuna oy ver; yapay zeka destekli kişilik sonuçlarını al.

## Mimari

- **Monolit**: Tek Next.js projesi, tek Node sunucusu, tek veritabanı.
- **Yığın**: Next.js (App Router), TypeScript, TailwindCSS, Framer Motion, Prisma, SQLite (varsayılan; isteğe bağlı PostgreSQL), Socket.io.

## Proje Yapısı (Özet)

- **`/app`** – Next.js App Router
  - **`page.tsx`** – Ana sayfa (hero, nasıl oynanır, Oyuna Başla)
  - **`/lobby`** – Lobi oluştur / katıl / oda (canlı oyuncu listesi, lider oyunu başlatır, kodu kopyala / paylaş)
  - **`/game`** – 10 soru, ilerleme çubuğu, oy butonları, yeniden bağlanma
  - **`/results`** – Yapay zeka tarzı sonuçlar ve konfeti
  - **`/admin`** – Giriş, panel, Kategoriler, Sorular, Modlar, CSV yükleme
  - **`/api`** – Lobi oluştur/katıl, modlar, analiz, oyun sonuçları, yönetici CRUD ve panel
- **`/lib`** – Ortam değişkenleri, Zod doğrulama, lobi kodu, veritabanı, lobi servisi, oyun mantığı, yapay zeka analizi (mock), yönetici auth, socket istemcisi
- **`/server`** – **`socket.ts`** – Socket.io olayları (lobi katıl/ayrıl, oyun başlat, sorular, oylar, sonuçlar, yeniden bağlanma)
- **`server.ts`** – Next + Socket.io’yu aynı Node sürecinde çalıştıran özel sunucu
- **`prisma/schema.prisma`** – Kullanıcılar, Lobiler, LobiOyuncu, Kategori, Soru, Mod, ModKategori, Oyun, Oy, AdminUser

## Yerleşik Özellikler

1. **Lobi** – 5 harfli kodla lobi oluşturma, koda göre katılma, canlı oyuncu listesi, lider oyunu başlatır ve mod seçer, kodu kopyalama/paylaşma, başlamak için en az 2 oyuncu.
2. **Oyun** – Moda göre 10 rastgele soru, tüm oyuncular seçenek olarak, moda göre kendine oy, tek oy, ilerleme çubuğu, Socket.io ile senkron.
3. **Sonuçlar** – **`GET /api/games/[gameId]/results`** ile sonuçlar; mock yapay zeka özetleri ve unvanlar; **`POST /api/analyze`** gerçek yapay zeka entegrasyonuna hazır.
4. **Yönetici** – `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş; Kategori/Soru/Mod CRUD; CSV toplu yükleme (her satıra bir soru); toplam oyun, en popüler mod, en çok oylanan sorular/oyuncular.
5. **Güvenlik** – Lobi kodu formatı, aynı lobide aynı takma ad yok, katılım için basit rate limit, çift oy yok, Zod ile girdi doğrulama, yönetici çerez kimlik doğrulama.

## Kurulum ve Çalıştırma

1. **`.env` kopyala** (varsayılan SQLite, ek kurulum yok)
   ```bash
   cp .env.example .env
   ```
   `DATABASE_URL`’i ayarla (örn. .env içinde DATABASE_URL="file:./dev.db" zaten vardır (varsayılan SQLite); değiştirmene gerek yok.

2. **Veritabanı ve seed**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
   Seed, Türkçe kategorileri, örnek soruları ve “Karışık” modunu oluşturur. Tam oyun için yönetici panelinden her kategoride 100+ soru ekleyin.

3. **Uygulamayı başlat**
   ```bash
   npm install
   npm run dev
   ```
   http://localhost:3000 adresini aç. Yönetici paneli için `/admin` ve `.env`’deki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş yap.

## Teknik Notlar

- **Socket.io** yolu: `/api/socket`; oyun durumu bellekte tutulur ve Prisma ile kalıcıdır.
- **Yapay zeka** – `lib/ai-analysis.ts` şu an mock; `OPENAI_API_KEY` tanımlandığında OpenAI ile değiştirilebilir.
- **Yeniden bağlanma** – İstemci `reconnect:lobby` ile `lobbyId` ve `userId` gönderir; sunucu lobi/oyun durumunu ve güncel soruyu tekrar gönderir.

## Lisans

MIT
