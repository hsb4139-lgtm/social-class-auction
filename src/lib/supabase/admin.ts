import "server-only";
import { createClient } from "@supabase/supabase-js";

/** 학생 요청 처리용: service role (서버에서만 사용, RLS 우회) */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
