import { NextRequest, NextResponse } from "next/server";
import { createLobbySchema } from "@/lib/validation";
import { createLobby } from "@/lib/lobby-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createLobbySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz giriş", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await createLobby(parsed.data.nickname, parsed.data.avatarId);
    if (!result) {
      return NextResponse.json(
        { error: "Benzersiz lobi kodu oluşturulamadı" },
        { status: 500 }
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[lobby/create]", e);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? `Sunucu hatası: ${message}` : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
