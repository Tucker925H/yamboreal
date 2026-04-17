import { getSupabase } from "@/lib/supabase";
import type { Post, PostWithProfile } from "@/lib/database.types";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * 画像をSupabase Storageにアップロード
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = getSupabase();
    // ファイル名を生成（ユーザーID + タイムスタンプ + ランダム + 拡張子）
    const fileExt = file.name.split(".").pop() || "jpg";
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}/${Date.now()}_${randomStr}.${fileExt}`;

    // デバッグ: ファイル名とfileの型
    console.log("Uploading file:", { fileName, file, fileType: typeof file });

    // Storageにアップロード
    const { data, error } = await supabase.storage
      .from("posts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log("Upload response:", { data, error });

    if (error) {
      alert(`画像アップロードエラー: ${error.message}`);
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
    alert(`画像アップロード例外: ${e instanceof Error ? e.message : e}`);
    console.error("Upload exception:", e);
    return { url: null, error: e as Error };
  }
}

/**
 * 投稿を作成
 */
export async function createPost(params: {
  session_token: string;
  image_url: string;
}): Promise<{ data: Post | null; error: Error | null }> {
  if (!params.session_token || !params.image_url) {
    return { data: null, error: new Error("session_tokenとimage_urlは必須です") };
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .insert(params)
    .select()

  if (error) {
    console.error("Create post error:", error);
    return { data: null, error };
  }

  return { data: (data && data.length > 0 ? data[0] : null), error: null };
}

/**
 * 投稿一覧を取得（プロフィール・班情報付き）
 */
export async function fetchPosts(): Promise<{
  data: PostWithProfile[];
  error: Error | null;
}> {
  if (isDevelopment) {
    return { data: [], error: null };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        session_token,
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

  // supabase returns null for empty, so fallback to []
  return { data: (data ?? []) as PostWithProfile[], error: null };
}
