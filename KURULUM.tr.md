# Yerelde Nasıl Çalıştırılır? (Türkçe)

Bu rehber, oyunu kendi bilgisayarında çalıştırmak için adım adım ne yapman gerektiğini anlatıyor.

---

## Gereksinim: Node.js

Bu proje **Node.js** ile çalışır. Bilgisayarında yüklü değilse:

1. **[https://nodejs.org](https://nodejs.org)** adresine git.
2. **LTS** sürümünü indir ve kur (Windows için .msi dosyası).
3. Kurulum bittikten sonra **terminali/PowerShell’i kapatıp yeniden aç**.
4. Kontrol et: `node -v` ve `npx -v` yazıp Enter’a bas; sürüm numarası görmelisin.

`'npx' is not recognized` veya `'node' is not recognized` hatası alıyorsan Node ya yüklü değildir ya da PATH’e eklenmemiştir; yukarıdaki adımları uygula.

---

## Adım 1: Ortam dosyasını kopyala ve veritabanını ayarla

Terminalde (PowerShell veya CMD) proje klasörüne gir. Sonra:

```bash
cp .env.example .env
```

*(Windows’ta `cp` yoksa: `.env.example` dosyasını kopyalayıp adını `.env` yap.)*

Ardından `.env` dosyasını aç. **Varsayılan olarak SQLite kullanılıyor** — ekstra program (PostgreSQL vb.) kurmana gerek yok. `.env` içinde şu satır olmalı:

```
DATABASE_URL="file:./dev.db"
```

Bu tek bir dosya (`dev.db`) olarak proje klasöründe oluşur; tüm oyun verileri (lobiler, sorular, oylar) burada saklanır. Hiçbir şey değiştirmeden devam edebilirsin.

*(İleride PostgreSQL kullanmak istersen: `prisma/schema.prisma` içinde `provider = "sqlite"` yerine `provider = "postgresql"` yapıp `.env`'de PostgreSQL bağlantı adresini yazman yeterli.)*

---

## Adım 2: Veritabanını oluştur ve örnek verileri yükle

Aynı terminalde sırayla şu komutları çalıştır:

### 1) Prisma modellerini oluştur
```bash
npx prisma generate
```
Bu komut, Prisma’nın veritabanı modellerini projeye tanıtır.

### 2) Tabloları veritabanında oluştur
```bash
npx prisma db push
```
Bu komut, şemayı veritabanına uygular; yani lobi, soru, oy vb. tabloları oluşturur.

### 3) Örnek verileri ekle (seed)
```bash
npm run db:seed
```
Bu komut Türkçe kategorileri (Karışık, Aşk, Gelecek, Kaos, Derin Sohbet, Komik), örnek soruları ve **“Karışık”** modunu ekler. Veritabanında zaten veri varsa seed atlanır.

**Önemli:** Oyun her modda 10 rastgele soru seçer. Her kategoride en az 10 soru olmalı. Rahat oynanması için yönetici panelinden her kategoride **100’den fazla soru** eklemen iyi olur.

---

## Adım 3: Projeyi başlat

### 1) Paketleri yükle (ilk seferde bir kez)
```bash
npm install
```
Bu komut gerekli tüm paketleri (Next.js, Prisma, Socket.io vb.) yükler.

### 2) Uygulamayı çalıştır
```bash
npm run dev
```
Bu komut hem web sunucusunu hem de oyun için gerekli Socket.io’yu başlatır. Terminalde “Ready on http://localhost:3000” gibi bir mesaj görürsün.

### 3) Tarayıcıda aç

Tarayıcıda şu adresi aç: **http://localhost:3000**

- Ana sayfa, lobi oluşturma / kodla katılma ve oyun buradan çalışır.

### Yönetici paneli

- Adres: **http://localhost:3000/admin**
- Giriş için `.env` dosyasındaki **ADMIN_EMAIL** ve **ADMIN_PASSWORD** değerlerini kullan.
- Bu değerleri `.env` içinde kendin belirleyebilirsin (örnek: `ADMIN_EMAIL=admin@test.com`, `ADMIN_PASSWORD=123456`).
- Yönetici panelinden kategoriler, sorular ve modlar ekleyip düzenleyebilirsin; CSV ile toplu soru da yükleyebilirsin.

---

## Teknik notlar (ne işe yarar?)

- **Socket.io:** Oyun, anlık güncellemeler (lobi listesi, sorular, oylar) için Socket.io kullanır. Bağlantı yolu: `/api/socket`. Oyun durumu hem sunucu belleğinde hem de Prisma ile veritabanında tutulur.
- **Yapay zeka:** Şu an `lib/ai-analysis.ts` içinde “sahte” (mock) analiz var. Gerçek yapay zeka kullanmak istersen `.env` dosyasına **OPENAI_API_KEY** ekleyip aynı dosyada OpenAI’ya geçiş yapabilirsin.
- **Yeniden bağlanma:** Oyuncu sayfayı yenilerse veya bağlantı koparsa, istemci sunucuya “reconnect:lobby” ile lobi ve kullanıcı bilgisini gönderir; sunucu lobi/oyun durumunu ve o anki soruyu tekrar yollar. Böylece oyuncu kaldığı yerden devam eder.

---

## İstersen sonra eklenebilecekler

- Lobide **oyuncu atma** (lider bir oyuncuyu lobiden çıkarabilsin).
- Soru başına **isteğe bağlı süre** (zamanlayıcı).
- **Aktif olmayan lobileri** belirli süre sonra otomatik silen bir görev.
