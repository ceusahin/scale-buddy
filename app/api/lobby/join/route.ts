import { NextRequest, NextResponse } from "next/server";
import { joinLobbySchema } from "@/lib/validation";
import { joinLobby } from "@/lib/lobby-service";

const joinAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 15;

function rateLimit(key: string): boolean {
  const now = Date.now();
  let entry = joinAttempts.get(key);
  if (!entry) {
    joinAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    joinAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = joinLobbySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Çok fazla katılım denemesi. Lütfen daha sonra tekrar dene." }, { status: 429 });
    }
    const result = await joinLobby(parsed.data.code, parsed.data.nickname, parsed.data.avatarId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
