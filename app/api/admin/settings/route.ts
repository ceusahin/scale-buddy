import { NextRequest, NextResponse } from "next/server";
import { getAdminEmailFromCookie, requireAdmin } from "@/lib/admin-auth";
import { adminUpdateSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = adminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Geçersiz istek";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = await getAdminEmailFromCookie();
    if (!email) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

    let admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      const envEmail = process.env.ADMIN_EMAIL;
      const envPassword = process.env.ADMIN_PASSWORD;
      if (email !== envEmail || !envPassword) {
        return NextResponse.json({ error: "Hesap güncellenemiyor" }, { status: 400 });
      }
      const envMatch = envPassword.startsWith("$2")
        ? await bcrypt.compare(parsed.data.currentPassword, envPassword)
        : parsed.data.currentPassword === envPassword;
      if (!envMatch) {
        return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });
      }
      admin = await prisma.adminUser.create({
        data: {
          email: envEmail,
          passwordHash: await bcrypt.hash(parsed.data.currentPassword, 10),
        },
      });
    } else {
      const match = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
      if (!match) {
        return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });
      }
    }

    const updateData: { email?: string; passwordHash?: string } = {};
    if (parsed.data.newEmail) {
      const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.newEmail } });
      if (existing && existing.id !== admin.id) {
        return NextResponse.json({ error: "Bu e-posta zaten kullanılıyor." }, { status: 400 });
      }
      updateData.email = parsed.data.newEmail;
    }
    if (parsed.data.newPassword) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, emailChanged: !!parsed.data.newEmail });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
