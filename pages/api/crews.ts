import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.from("crews").select("id, name");
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
