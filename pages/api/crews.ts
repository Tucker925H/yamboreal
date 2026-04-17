import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === "development") {
    return res.status(200).json([
      { id: 1, name: "A班" },
      { id: 2, name: "B班" },
      { id: 3, name: "C班" },
    ]);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.from("crews").select("id, name");
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
