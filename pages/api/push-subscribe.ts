import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const { subscription } = req.body;
  if (!subscription) {
    return res.status(400).json({ error: "subscription required" });
  }
  // ユーザーID取得（認証済みの場合のみ）
  const user_id = req.headers["x-user-id"] || null;
  // Supabase保存
  const { error } = await supabase.from("push_subscriptions").insert([
    {
      user_id,
      subscription,
    },
  ]);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true });
}
