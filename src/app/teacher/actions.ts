"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher, requireClass } from "@/lib/teacher";

export type ActionResult = { ok: boolean; message?: string };
export type PinCard = { number: number; name: string; pin: string };

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0,O,1,I 제외

function randomCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}
function randomPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}
function toInt(v: FormDataEntryValue | null, fallback = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/* ---------------- 학급 ---------------- */

export async function createClass(formData: FormData) {
  const { supabase, cls } = await getTeacher();
  if (cls) redirect("/teacher");
  const name = String(formData.get("name") || "").trim() || "우리 반";
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase.from("classes").insert({ name, join_code: randomCode() });
    if (!error) break;
    if (!error.message.includes("join_code")) throw new Error(error.message);
  }
  revalidatePath("/teacher");
  redirect("/teacher");
}

export async function updateClassSettings(formData: FormData) {
  const { supabase, cls } = await requireClass();
  const name = String(formData.get("name") || "").trim() || cls.name;
  const practice = Math.max(0, toInt(formData.get("practice_coins"), cls.practice_coins));
  await supabase.from("classes").update({ name, practice_coins: practice }).eq("id", cls.id);
  revalidatePath("/teacher", "layout");
}

/* ---------------- 학생 ---------------- */

/** "1 김민준" / "1<TAB>김민준" / "김민준" 형식의 줄들을 학생으로 등록하고 새 PIN 목록을 돌려줌 */
export async function addStudents(text: string): Promise<ActionResult & { cards?: PinCard[] }> {
  const { supabase, cls } = await requireClass();
  const { data: existing } = await supabase.from("students").select("number").eq("class_id", cls.id);
  const used = new Set((existing ?? []).map((s: { number: number }) => s.number));
  let next = Math.max(0, ...used) + 1;

  const rows: { class_id: string; number: number; name: string; pin_hash: string }[] = [];
  const cards: PinCard[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d+)[\s,.\t번]+(.+)$/);
    let number: number;
    let name: string;
    if (m) {
      number = parseInt(m[1], 10);
      name = m[2].trim();
    } else {
      while (used.has(next)) next++;
      number = next;
      name = line;
    }
    if (used.has(number)) return { ok: false, message: `${number}번은 이미 있어요. 번호를 확인해 주세요.` };
    used.add(number);
    const pin = randomPin();
    rows.push({ class_id: cls.id, number, name, pin_hash: bcrypt.hashSync(pin, 8) });
    cards.push({ number, name, pin });
  }
  if (!rows.length) return { ok: false, message: "입력된 학생이 없어요." };
  const { error } = await supabase.from("students").insert(rows);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/teacher", "layout");
  return { ok: true, cards: cards.sort((a, b) => a.number - b.number) };
}

export async function resetPins(studentIds: string[]): Promise<ActionResult & { cards?: PinCard[] }> {
  const { supabase, cls } = await requireClass();
  const { data: students } = await supabase
    .from("students")
    .select("id, number, name")
    .eq("class_id", cls.id)
    .in("id", studentIds);
  const cards: PinCard[] = [];
  for (const s of students ?? []) {
    const pin = randomPin();
    await supabase
      .from("students")
      .update({ pin_hash: bcrypt.hashSync(pin, 8), failed_attempts: 0, locked_until: null })
      .eq("id", s.id);
    cards.push({ number: s.number, name: s.name, pin });
  }
  return { ok: true, cards: cards.sort((a, b) => a.number - b.number) };
}

export async function updateStudent(id: string, patch: { name?: string; is_active?: boolean }) {
  const { supabase } = await requireClass();
  await supabase.from("students").update(patch).eq("id", id);
  revalidatePath("/teacher", "layout");
}

/* ---------------- 코인 ---------------- */

export async function grantCoins(input: {
  studentIds: string[] | "all";
  amount: number;
  reason: string;
}): Promise<ActionResult> {
  const { supabase, cls } = await requireClass();
  const amount = Math.trunc(input.amount);
  if (!amount) return { ok: false, message: "금액을 입력해 주세요." };
  let ids: string[];
  if (input.studentIds === "all") {
    const { data } = await supabase.from("students").select("id").eq("class_id", cls.id).eq("is_active", true);
    ids = (data ?? []).map((s: { id: string }) => s.id);
  } else ids = input.studentIds;
  if (!ids.length) return { ok: false, message: "학생을 골라 주세요." };

  const batch_id = crypto.randomUUID();
  const reason = input.reason.trim() || (amount > 0 ? "코인 지급" : "코인 차감");
  const { error } = await supabase.from("coin_ledger").insert(
    ids.map((student_id) => ({
      class_id: cls.id,
      student_id,
      amount,
      type: amount > 0 ? "grant" : "deduct",
      reason,
      batch_id,
    })),
  );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/teacher", "layout");
  return { ok: true, message: `${ids.length}명에게 ${amount > 0 ? "+" : ""}${amount} 코인 (${reason})` };
}

export async function undoBatch(batchId: string): Promise<ActionResult> {
  const { supabase, cls } = await requireClass();
  const { data: rows } = await supabase
    .from("coin_ledger")
    .select("*")
    .eq("class_id", cls.id)
    .eq("batch_id", batchId)
    .eq("undone", false)
    .in("type", ["grant", "deduct"]);
  if (!rows?.length) return { ok: false, message: "되돌릴 내역이 없어요." };
  const undoId = crypto.randomUUID();
  await supabase.from("coin_ledger").insert(
    rows.map((r) => ({
      class_id: cls.id,
      student_id: r.student_id,
      amount: -r.amount,
      type: "undo",
      reason: `되돌리기: ${r.reason}`,
      batch_id: undoId,
    })),
  );
  await supabase.from("coin_ledger").update({ undone: true }).eq("batch_id", batchId);
  revalidatePath("/teacher", "layout");
  return { ok: true, message: "되돌렸어요." };
}

/* ---------------- 물건 ---------------- */

export async function createItem(formData: FormData) {
  const { supabase, cls } = await requireClass();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await supabase.from("items").insert({
    class_id: cls.id,
    name,
    description: String(formData.get("description") || "").trim(),
    emoji: String(formData.get("emoji") || "").trim() || "🎁",
    default_quantity: Math.max(1, toInt(formData.get("default_quantity"), 1)),
    min_bid: Math.max(1, toInt(formData.get("min_bid"), 1)),
  });
  revalidatePath("/teacher/items");
}

export async function setItemArchived(id: string, archived: boolean) {
  const { supabase } = await requireClass();
  await supabase.from("items").update({ archived }).eq("id", id);
  revalidatePath("/teacher/items");
}

/* ---------------- 경매 ---------------- */

export async function createAuction(input: {
  title: string;
  mode: "practice" | "real";
  showWinnerNames: boolean;
  lots: { itemId: string; quantity: number }[];
}): Promise<ActionResult & { id?: string }> {
  const { supabase, cls } = await requireClass();
  if (!input.lots.length) return { ok: false, message: "물건을 하나 이상 골라 주세요." };
  const { data: auction, error } = await supabase
    .from("auctions")
    .insert({
      class_id: cls.id,
      title: input.title.trim() || (input.mode === "practice" ? "연습 경매" : "이벤트 경매"),
      mode: input.mode,
      show_winner_names: input.showWinnerNames,
    })
    .select("id")
    .single();
  if (error || !auction) return { ok: false, message: error?.message ?? "만들지 못했어요." };
  await supabase.from("auction_lots").insert(
    input.lots.map((l, i) => ({
      auction_id: auction.id,
      item_id: l.itemId,
      quantity: Math.max(1, Math.trunc(l.quantity)),
      position: i,
    })),
  );
  revalidatePath("/teacher/auctions");
  return { ok: true, id: auction.id };
}

export async function openAuction(id: string, minutes: number): Promise<ActionResult> {
  const { supabase } = await requireClass();
  const closes_at = minutes > 0 ? new Date(Date.now() + minutes * 60_000).toISOString() : null;
  const { error } = await supabase
    .from("auctions")
    .update({ status: "open", opened_at: new Date().toISOString(), closes_at })
    .eq("id", id)
    .eq("status", "draft");
  if (error) {
    if (error.message.includes("one_open_auction")) return { ok: false, message: "이미 입찰 중인 경매가 있어요. 먼저 마감해 주세요." };
    return { ok: false, message: error.message };
  }
  revalidatePath(`/teacher/auctions/${id}`);
  return { ok: true };
}

export async function closeAuction(id: string): Promise<ActionResult> {
  const { supabase } = await requireClass();
  const { error } = await supabase.rpc("close_auction", { p_auction: id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/teacher", "layout");
  return { ok: true };
}

export async function revealAuction(id: string): Promise<ActionResult> {
  const { supabase } = await requireClass();
  await supabase.from("auctions").update({ status: "revealed" }).eq("id", id).eq("status", "closed");
  revalidatePath(`/teacher/auctions/${id}`);
  return { ok: true };
}

export async function deleteDraftAuction(id: string) {
  const { supabase } = await requireClass();
  await supabase.from("auctions").delete().eq("id", id).eq("status", "draft");
  revalidatePath("/teacher/auctions");
  redirect("/teacher/auctions");
}

/* ---------------- 기록 ---------------- */

export async function setInventoryUsed(id: string, used: boolean) {
  const { supabase } = await requireClass();
  await supabase
    .from("inventory")
    .update({ status: used ? "used" : "owned", used_at: used ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/teacher/records");
}
