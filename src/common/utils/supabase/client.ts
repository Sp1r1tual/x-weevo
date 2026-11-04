import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

/**
 * Server-only client: uploads are authorized by `assertAdmin`, and the secret key
 * lets them through the bucket's policies, which only allow public reads.
 */
export function getSupabaseStorageClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY env vars");
    }
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
}
