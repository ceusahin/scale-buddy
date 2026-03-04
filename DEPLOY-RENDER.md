# Render Üzerinde Yayınlama (Scale Your Friends)

Evet, bu projeyi **Render** üzerinden yayınlayabilirsiniz. Socket.io ve admin paneli (canlı veriler dahil) Render’da çalışır.

---

## Özet: Ne Yapacaksınız?

1. Projeyi **GitHub**’a atacaksınız (henüz yoksa).
2. **Render**’da ücretsiz bir **PostgreSQL** veritabanı oluşturacaksınız.
3. **Render**’da bir **Web Service** oluşturup bu repoyu bağlayacaksınız.
4. Ortam değişkenlerini (ör. `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) gireceksiniz.
5. Build / start komutlarını ayarlayacaksınız.

Bunları yaptıktan sonra site canlı yayında olur; admin panelinden verileri ve canlı istatistikleri takip edebilirsiniz.

---

## Adım 1: Projeyi GitHub’a Atın

- Proje klasöründe git yoksa: `git init`, sonra tüm dosyaları ekleyip commit atın.
- GitHub’da yeni bir repo oluşturup projeyi push edin.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git push -u origin main
```

---

## Adım 2: Render’da PostgreSQL Oluşturun

1. [render.com](https://render.com) → giriş yapın.
2. **Dashboard** → **New +** → **PostgreSQL**.
3. İsim verin (örn. `scale-your-friends-db`), bölge seçin.
4. **Free** planı seçin → **Create Database**.
5. Veritabanı oluştuktan sonra **Connection string** (içinde `postgresql://...`) görünecek. Bunu kopyalayın; **Internal** olanı kullanın (Render Web Service aynı ağda olacak).

Örnek format:

```text
postgresql://kullanici:sifre@dpg-xxxxx-a.oregon-postgres.render.com/db_adi
```

Bazen bağlantı için `?sslmode=require` eklemeniz gerekir. Örnek:

```text
postgresql://kullanici:sifre@dpg-xxxxx-a.oregon-postgres.render.com/db_adi?sslmode=require
```

---

## Adım 3: Prisma’yı PostgreSQL İçin Ayarlayın

Render’da kalıcı veri için **PostgreSQL** kullanmalısınız (SQLite Render’da her deploy’da sıfırlanır).

1. **prisma/schema.prisma** dosyasını açın.
2. `datasource db` kısmında `provider` değerini şöyle değiştirin:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(Eskisi: `provider = "sqlite"`)

3. Değişikliği kaydedip repoya push edin:

```bash
git add prisma/schema.prisma
git commit -m "Use PostgreSQL for Render"
git push
```

Yerelde tekrar SQLite kullanmak isterseniz bu satırı `provider = "sqlite"` yapıp `DATABASE_URL`’i `file:./dev.db` yapabilirsiniz.

---

## Adım 4: Render’da Web Service Oluşturun

1. Render Dashboard → **New +** → **Web Service**.
2. GitHub hesabınızı bağlayıp **scale-your-friends** repoyu seçin.
3. Ayarlar:

| Ayar | Değer |
|------|--------|
| **Name** | `scale-your-friends` (veya istediğiniz isim) |
| **Region** | PostgreSQL ile aynı bölge (örn. Oregon) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |

4. **Advanced** → **Add Environment Variable** ile aşağıdakileri ekleyin:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (Adım 2’de kopyaladığınız PostgreSQL connection string; Internal URL) |
| `ADMIN_EMAIL` | Admin girişi için e-posta (örn. `admin@site.com`) |
| `ADMIN_PASSWORD` | Admin şifresi (güçlü bir şifre seçin) |

İsteğe bağlı:

- `OPENAI_API_KEY` – AI analizi kullanacaksanız.

5. **Create Web Service**’e tıklayın.

İlk deploy’da Render build alır ve uygulamayı başlatır. Veritabanı tablolarını oluşturmak için **tek seferlik** şu adım gerekir:

---

## Adım 5: Veritabanı Tablolarını Oluşturun

Render, build sırasında `prisma generate` çalıştırır ama tabloları oluşturmaz. Tabloları oluşturmak için:

**Seçenek A – Render Shell (önerilen)**  
1. Web Service sayfasında **Shell** sekmesine girin.  
2. Şunu çalıştırın:

```bash
npx prisma db push
```

3. İsterseniz seed (örnek veri) için:

```bash
npm run db:seed
```

**Seçenek B – Yerelde çalıştırma**  
Yerelde `DATABASE_URL`’i Render’daki PostgreSQL connection string (External URL) yapıp:

```bash
npx prisma db push
npm run db:seed   # isteğe bağlı
```

Sonra tekrar `DATABASE_URL`’i yerel SQLite’a çevirebilirsiniz.

Bu adımdan sonra uygulama veritabanıyla konuşabilir; admin paneli ve canlı istatistikler çalışır.

---

## Adım 6: Kontrol

- Render, size bir URL verir (örn. `https://scale-your-friends-xxxx.onrender.com`).
- Bu adresi açın: oyun arayüzü ve lobi akışı çalışmalı.
- `/admin` → Yukarıda girdiğiniz `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş yapın.
- Admin panelinden toplam oyunlar, kullanıcılar, canlı lobi/kullanıcı sayıları ve diğer verileri takip edebilirsiniz.

---

## Build hatası logda görünmüyorsa

- **Tam log:** Render’da Build log penceresinde **aşağı kaydırın**. Hata genelde “Creating an optimized production build ...” satırından **sonra** çıkar. “Failed to compile”, “Module not found”, “Cannot find module” gibi satırları arayın. “View full log” veya “Download logs” varsa tam çıktıyı indirip kontrol edin.
- **Bellek (OOM):** Free tier’da Next.js build bazen belleği aşar ve process sessizce sonlanır (net hata görünmez). Render Dashboard → Web Service → **Environment** bölümüne şu değişkeni ekleyin:
  - **Key:** `NODE_OPTIONS`
  - **Value:** `--max-old-space-size=1024`
  Sonra **Manual Deploy** ile tekrar build alın.

---

## Önemli Notlar

- **Ücretsiz plan:** Servis bir süre kullanılmazsa uyur; ilk istekte 30–50 saniye uyanma süresi olabilir. WebSocket (Socket.io) uyandıktan sonra normal çalışır.
- **Canlı veri:** Admin panelindeki “canlı lobi / bağlı kullanıcı” bilgisi, aynı Render Web Service üzerinde çalışan Socket.io sunucusundan gelir; yani Render’da **aktif olarak** takip edebilirsiniz.
- **Şifre:** `ADMIN_PASSWORD`’ü güçlü tutun ve hiçbir yerde (kod, repo) paylaşmayın; sadece Render Environment’ta olsun.

Özet: Evet, projeyi Render üzerinden yayınlayabilirsiniz; admin panelinden verileri ve canlı istatistikleri aktif olarak takip edebilirsiniz. Yukarıdaki adımlar bunun için yeterlidir.
