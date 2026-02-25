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
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: "invalid subscription format" });
  }
  const user_id = req.headers["x-user-id"] || null;
  const { error } = await supabase.from("push_subscriptions").insert([
    {
      user_id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  ]);
  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: error.message, details: error });
  }
  return res.status(200).json({ success: true });
}
