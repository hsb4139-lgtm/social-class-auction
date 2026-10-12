import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "student_session";
const secret = () => new TextEncoder().encode(process.env.STUDENT_SESSION_SECRET || "dev-secret-change-me");

export type StudentSession = { sid: string; cid: string };

export async function setStudentSession(s: StudentSession) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sid !== "string" || typeof payload.cid !== "string") return null;
    return { sid: payload.sid, cid: payload.cid };
  } catch {
    return null;
  }
}

export async function clearStudentSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
