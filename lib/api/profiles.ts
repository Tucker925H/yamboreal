import { getSupabase } from "@/lib/supabase";
import type { ProfileWithCrew } from "@/lib/database.types";

const isDevelopment = process.env.NODE_ENV === "development";

function createMockProfile(userId: string): ProfileWithCrew {
  return {
    session_token: userId,
    display_name: "Dev User",
    crew_id: 1,
    created_at: new Date().toISOString(),
    crews: { id: 1, name: "A班" },
  };
}

/**
 * ユーザーIDからプロフィールを取得（crew情報含む）
 */
export async function fetchProfile(
  userId: string
): Promise<{ data: any | null; error: Error | null }> {
  if (isDevelopment) {
    return { data: createMockProfile(userId), error: null };
  }

  console.log("fetchProfile 呼び出し - userId:", userId);

  const supabase = getSupabase();
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
  if (isDevelopment) {
    return true;
  }

  const supabase = getSupabase();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("session_token")
    .eq("session_token", userId)
    .maybeSingle();

  return !!profiles;
}

/**
 * プロフィールが存在するか確認（詳細情報付き）
 */
export async function checkProfileExistsWithData(userId: string): Promise<{
  exists: boolean;
  profile: ProfileWithCrew | null;
}> {
  if (isDevelopment) {
    return { exists: true, profile: createMockProfile(userId) };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      crews (
        id,
        name
      )
    `)
    .eq("session_token", userId)
    .maybeSingle();

  if (error || !data) {
    return { exists: false, profile: null };
  }

  return { exists: true, profile: data as ProfileWithCrew };
}

/**
 * プロフィールを作成
 */
export async function createProfile(params: {
  session_token: string;
  display_name: string;
  crew_id: number;
}): Promise<{ success: boolean; error: Error | null }> {
  if (isDevelopment) {
    return { success: true, error: null };
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("profiles").insert(params);

  if (error) {
    console.error("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
