import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { session_token } = req.body;
  if (!session_token) return res.status(400).json({ error: "session_tokenは必須です" });

  if (process.env.NODE_ENV === "development") {
    return res.status(200).json({
      profile: {
        session_token,
        display_name: "Dev User",
        crew_id: 1,
        created_at: new Date().toISOString(),
        crews: { id: 1, name: "A班" },
      },
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // session_tokenでプロフィール検索（班情報含む）
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, crews(id, name)")
    .eq("session_token", session_token)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!profile) return res.status(404).json({ error: "プロフィールが見つかりません" });

  res.status(200).json({ profile });
}
