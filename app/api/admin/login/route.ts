import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz giriş" }, { status: 400 });
    }
    const { email: inputEmail, password: inputPassword } = parsed.data;

    const dbAdmin = await prisma.adminUser.findUnique({ where: { email: inputEmail } });
    if (dbAdmin) {
      const match = await bcrypt.compare(inputPassword, dbAdmin.passwordHash);
      if (!match) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
      }
      const token = Buffer.from(`${dbAdmin.email}:${Date.now()}`).toString("base64");
      const res = NextResponse.json({ ok: true, token });
      res.cookies.set("admin_token", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 });
      return res;
    }

    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    if (!envEmail || !envPassword) {
      return NextResponse.json({ error: "Yönetici hesabı yapılandırılmamış" }, { status: 503 });
    }
    if (inputEmail !== envEmail) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
    }
    const match = envPassword.startsWith("$2")
      ? await bcrypt.compare(inputPassword, envPassword)
      : inputPassword === envPassword;
    if (!match) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
    }
    const token = Buffer.from(`${envEmail}:${Date.now()}`).toString("base64");
    const res = NextResponse.json({ ok: true, token });
    res.cookies.set("admin_token", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
