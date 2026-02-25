import { supabase } from "@/lib/supabase";
import type { Crew } from "@/lib/database.types";

/**
 * 班一覧を取得
 */
export async function fetchCrews(): Promise<{
  data: Crew[];
  error: Error | null;
}> {
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
