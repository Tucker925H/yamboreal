import { supabase } from "@/lib/supabase";
import type { Crew } from "@/lib/database.types";

const isDevelopment = process.env.NODE_ENV === "development";
const mockCrews: Crew[] = [
  { id: 1, name: "A班" },
  { id: 2, name: "B班" },
  { id: 3, name: "C班" },
];

/**
 * 班一覧を取得
 */
export async function fetchCrews(): Promise<{
  data: Crew[];
  error: Error | null;
}> {
  if (isDevelopment) {
    return { data: mockCrews, error: null };
  }

  try {
    const { data, error } = await supabase
      .from("crews")
      .select("*");

    if (error) {
      console.error("Error fetching crews:", error);
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  } catch (e) {
    console.error("fetchCrews 例外:", e);
    return { data: [], error: e as Error };
  }
}
