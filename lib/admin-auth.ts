import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function getAdminEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [email] = decoded.split(":");
    return email ?? null;
  } catch {
    return null;
  }
}

/** Admin yetkisi var mı (cookie'deki email env veya DB'deki admin ile eşleşiyor mu). */
export async function requireAdmin(): Promise<boolean> {
  const email = await getAdminEmailFromCookie();
  if (!email) return false;
  if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) return true;
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  return !!admin;
}

export function getAdminAuthHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}
