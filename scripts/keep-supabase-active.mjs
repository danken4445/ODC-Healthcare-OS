import { createClient } from "@supabase/supabase-js";

// Read Supabase credentials from environment variables or fall back to known project keys
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pjpkutapkwpvvmholjyq.supabase.co";

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_HU3SMxXb_PcBOic5Ck7vjA_tCI_DLkP";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase URL or Anon Key. Cannot ping database.");
  process.exit(1);
}

console.log(`[${new Date().toISOString()}] 🚀 Initiating Supabase keep-alive ping...`);
console.log(`Target Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function keepActive() {
  const startTime = Date.now();
  try {
    // 1. Perform a lightweight query against a standard table
    const { data, error, status } = await supabase
      .from("practitioner_roles")
      .select("id")
      .limit(1);

    const durationMs = Date.now() - startTime;

    if (error && status !== 200) {
      console.warn(`⚠️ Query returned error (status ${status}):`, error.message);
      // Fallback: ping Supabase Auth health endpoint
      const healthRes = await fetch(`${supabaseUrl}/auth/v1/health`);
      if (healthRes.ok) {
        console.log(`✅ Auth health check succeeded with status ${healthRes.status} (${durationMs}ms)`);
        console.log("Supabase instance has registered external activity.");
        return;
      }
      throw error;
    }

    console.log(
      `✅ Supabase ping successful! Status: ${status}, Records returned: ${data ? data.length : 0} (${durationMs}ms)`
    );
    console.log("Activity registered successfully to prevent project pausing.");
  } catch (err) {
    console.error("❌ Failed to ping Supabase instance:", err);
    process.exit(1);
  }
}

keepActive();
