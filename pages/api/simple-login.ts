import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { display_name, crew_id } = req.body;
  if (!display_name || !crew_id) return res.status(400).json({ error: "display_nameとcrew_idは必須です" });

  // profiles検索
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, crew_id, session_token")
    .eq("display_name", display_name)
    .eq("crew_id", crew_id)
    .limit(1)
    .maybeSingle();

  // なければ新規作成
  if (!profile) {
    const session_token = crypto.randomUUID();
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        { display_name, crew_id, session_token }
      ])
      .select("id, display_name, crew_id, session_token")
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    profile = data;
  } else {
    // session_token更新
    const session_token = crypto.randomUUID();
    const { error, data } = await supabase
      .from("profiles")
      .update({ session_token })
      .eq("id", profile.id)
      .select("id, display_name, crew_id, session_token")
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    profile = data || { ...profile, session_token };
  }

  if (!profile) {
    return res.status(500).json({ error: "プロフィール情報の取得に失敗しました" });
  }
  res.status(200).json({ session_token: profile.session_token, user: profile });
}
