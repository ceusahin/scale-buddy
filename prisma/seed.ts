import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = ["Karışık", "Aşk", "Gelecek", "Kaos", "Derin Sohbet", "Komik"];

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  Karışık: [
    "Zombi kıyametinde en uzun kim hayatta kalır?",
    "Sürpriz partide sırrı yanlışlıkla kim ağzından kaçırır?",
    "En önce viral TikTok yıldızı kim olur?",
    "Kendi doğum gününü kim unutur?",
    "Gördüğü her sokak hayvanını kim sahiplenir?",
  ],
  Aşk: [
    "En güzel aşk mektuplarını kim yazar?",
    "En romantik randevuyu kim planlar?",
    "İlk görüşte aşık olan kim?",
    "En iyi kanat adamı kim olur?",
    "En iyi ilişki tavsiyesini kim verir?",
  ],
  Gelecek: [
    "10 yılda ünlü olacak kim?",
    "İlk zaman yolculuğuna kim çıkar?",
    "En çok çocuğu kim yapar?",
    "Mars'ta kim yaşar?",
    "En önce kim emekli olur?",
  ],
  Kaos: [
    "Flash mob başlatan kim olur?",
    "Cenazede yanlış lafı kim eder?",
    "Kendi mahallesinde kaybolan kim?",
    "Tüm şirkete yanlışlıkla reply-all atan kim?",
    "Bir güvercinle kavga etmeye kalkan kim?",
  ],
  "Derin Sohbet": [
    "Hayatın anlamı hakkında en çok kim düşünür?",
    "Felsefe kitabı yazacak kim?",
    "En iyi tavsiyeyi kim verir?",
    "Meditasyon retreat'ine kim öncülük eder?",
    "Her şeyi sorgulayan kim?",
  ],
  Komik: [
    "Düz yolda takılıp düşen kim?",
    "En kötü kelime oyunlarını kim yapar?",
    "Kendi kendine konuşurken yakalanan kim?",
    "Sahnedeki repliğini unutan kim?",
    "Kendi esprilerine gülen kim?",
  ],
};

async function main() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log("Veritabanında zaten veri var. Seed atlanıyor.");
    return;
  }

  for (const name of CATEGORIES) {
    await prisma.category.create({
      data: { name, isActive: true },
    });
  }

  const categories = await prisma.category.findMany();
  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));

  for (const [catName, questions] of Object.entries(SAMPLE_QUESTIONS)) {
    const cat = byName[catName];
    if (!cat) continue;
    for (const text of questions) {
      await prisma.question.create({
        data: { text, categoryId: cat.id },
      });
    }
  }

  const mixedCat = byName["Karışık"];
  const loveCat = byName["Aşk"];
  const futureCat = byName["Gelecek"];
  const chaosCat = byName["Kaos"];
  const deepCat = byName["Derin Sohbet"];
  const funnyCat = byName["Komik"];

  if (mixedCat && loveCat && futureCat) {
    await prisma.mode.create({
      data: {
        name: "Karışık",
        selfVoteAllowed: true,
        timerEnabled: false,
        isActive: true,
      },
    });
  }

  const mixed = await prisma.mode.findFirst({ where: { name: "Karışık" } });
  if (mixed && mixedCat && loveCat && futureCat && chaosCat && deepCat && funnyCat) {
    await prisma.modeCategory.createMany({
      data: [mixedCat, loveCat, futureCat, chaosCat, deepCat, funnyCat].map((c) => ({
        modeId: mixed.id,
        categoryId: c.id,
      })),
    });
  }

  if ((await prisma.adminUser.count()) === 0) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      await prisma.adminUser.create({
        data: {
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 10),
        },
      });
      console.log("Admin kullanıcı .env bilgileriyle oluşturuldu.");
    }
  }

  console.log("Seed tamamlandı. Tam oyun için yönetici panelinden her kategoride 100+ soru ekleyin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
