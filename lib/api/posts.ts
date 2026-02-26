import { supabase } from "@/lib/supabase";
import type { Post, PostWithProfile } from "@/lib/database.types";

/**
 * 画像をSupabase Storageにアップロード
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // ファイル名を生成（ユーザーID + タイムスタンプ + 拡張子）
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Storageにアップロード
    const { data, error } = await supabase.storage
      .from("posts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log("Upload response:", { data, error });

    if (error) {
      console.error("Upload error:", error);
      return { url: null, error };
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from("posts")
      .getPublicUrl(data.path);
    console.log("Public URL data:", urlData);
    return { url: urlData.publicUrl, error: null };
  } catch (e) {
    console.error("Upload exception:", e);
    return { url: null, error: e as Error };
  }
}

/**
 * 投稿を作成
 */
export async function createPost(params: {
  user_id: string;
  image_url: string;
}): Promise<{ data: Post | null; error: Error | null }> {
   if (!params.user_id || !params.image_url) {
    return { data: null, error: new Error("user_idとimage_urlは必須です") };
  }
  const { data, error } = await supabase
    .from("posts")
    .insert(params)
    .select()

  if (error) {
    console.error("Create post error:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 投稿一覧を取得（プロフィール・班情報付き）
 */
export async function fetchPosts(): Promise<{
  data: PostWithProfile[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        uuid,
        display_name,
        crew_id,
        crews (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch posts error:", error);
    return { data: [], error };
  }

  return { data: data as PostWithProfile[], error: null };
}
