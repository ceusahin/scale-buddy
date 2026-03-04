import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz giriş", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await prisma.feedback.create({
      data: {
        type: parsed.data.type,
        text: parsed.data.text,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[feedback]", e);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? `Gönderilemedi: ${message}` : "Gönderilemedi" },
      { status: 500 }
    );
  }
}
