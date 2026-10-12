import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-session";
import { loadStudentState } from "@/lib/student-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getStudentSession();
  if (!s) return NextResponse.json({ error: "login" }, { status: 401 });
  const state = await loadStudentState(s.sid, s.cid);
  if (!state) return NextResponse.json({ error: "login" }, { status: 401 });
  return NextResponse.json(state);
}
