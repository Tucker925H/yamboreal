import { supabase } from "@/lib/supabase";
import type { ProfileWithCrew } from "@/lib/database.types";

/**
 * ユーザーIDからプロフィールを取得（crew情報含む）
 */
export async function fetchProfile(
  userId: string
): Promise<{ data: any | null; error: Error | null }> {
  console.log("fetchProfile 呼び出し - userId:", userId);
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")

  console.log("fetchProfile レスポンス:", { data, error });

  if (error) {
    console.error("Error fetching profile:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * プロフィールが存在するか確認
 */
export async function checkProfileExists(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("uuid")
    .eq("uuid", userId)
    .maybeSingle();

  return !!data;
}

/**
 * プロフィールを作成
 */
export async function createProfile(params: {
  uuid: string;
  display_name: string;
  crew_id: number;
}): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase.from("profiles").insert(params);

  if (error) {
    console.error("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
