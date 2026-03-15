"use client";

import { uploadImage, createPost, fetchPosts } from "@/lib/api";
import type { PostWithProfile } from "@/lib/database.types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useAuth } from "../providers";

// ---- イベント定義 ----
// 新しいイベントを追加するには、この配列にオブジェクトを追記するだけでOK
type TimelineEvent = {
  id: string;
  name: string;
  startDate: string; // JST YYYY-MM-DD
  endDate: string;   // JST YYYY-MM-DD (inclusive)
};

const EVENTS: TimelineEvent[] = [
  {
    id: "3rd-kinki-rs-yamboree-2026",
    name: "3rd KINKI RS YamBoree",
    startDate: "2026-02-26",
    endDate: "2026-03-02",
  },
  // 例: 次のイベントはここに追加
  // { id: "next-event", name: "Next Event", startDate: "2026-08-01", endDate: "2026-08-03" },
];

/** UTC の created_at 文字列を JST の YYYY-MM-DD に変換する */
const toJSTDateString = (utcString: string): string => {
  const jst = new Date(new Date(utcString).getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
};

export default function TimelinePage() {
    // Push通知受信時のタイムスタンプ
    const [pushTimestamp, setPushTimestamp] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number>(0);

    // サービスワーカーからのpush-receivedメッセージを受信
    useEffect(() => {
      if (typeof window === "undefined") return;
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "push-received" && event.data.timestamp) {
          localStorage.setItem("pushTimestamp", String(event.data.timestamp));
          setPushTimestamp(event.data.timestamp);
        }
      };
      navigator.serviceWorker?.addEventListener("message", handler);
      // 初期化: localStorageから復元
      const ts = localStorage.getItem("pushTimestamp");
      if (ts) setPushTimestamp(Number(ts));
      return () => {
        navigator.serviceWorker?.removeEventListener("message", handler);
      };
    }, []);

    // カウントダウン管理
    useEffect(() => {
      if (!pushTimestamp) {
        setCountdown(0);
        return;
      }
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((pushTimestamp + 2 * 60 * 1000 - now) / 1000);
        setCountdown(diff > 0 ? diff : 0);
        if (diff <= 0) {
          localStorage.removeItem("pushTimestamp");
          setPushTimestamp(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [pushTimestamp]);
  const { sessionToken, profile, isLoading } = useAuth();
  
  // SWRで投稿一覧をキャッシュ (初回取得後はキャッシュを使用)
  const { data: postsData, mutate: mutatePosts } = useSWR(
    "posts",
    async () => {
      const { data } = await fetchPosts();
      return data;
    },
    {
      revalidateOnFocus: false,  // フォーカス時に再取得しない
      revalidateOnReconnect: false,  // 再接続時に再取得しない
      dedupingInterval: 60000,  // 60秒間は重複リクエストを防止
    }
  );
  const posts = postsData ?? [];
  
  const [selectedPost, setSelectedPost] = useState<PostWithProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // カメラボタンクリック
  const handleCameraClick = () => {
    if (!sessionToken || !profile) {
      alert("ログインしてください");
      return;
    }
    fileInputRef.current?.click();
  };

  // 写真選択時
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionToken || !profile) return;

    setIsUploading(true);

    try {
      // 画像をアップロード
      const { url, error: uploadError } = await uploadImage(file, profile.session_token);
      console.log("uploadImage result:", { url, uploadError });
      if (uploadError || !url) {
        alert("画像のアップロードに失敗しました");
        setIsUploading(false);
        return;
      }

      // 投稿を作成
      console.log("Creating post with URL:", url);
      console.log("Profile info:", profile);
      const { data: post, error: postError } = await createPost({
        session_token: profile.session_token,
        image_url: url,
      });

      if (postError || !post) {
        alert("投稿の作成に失敗しました");
        setIsUploading(false);
        return;
      }

      // SWRのキャッシュを更新（再取得をトリガー）
      await mutatePosts();

      alert("投稿しました！");
    } catch (err) {
      console.error("Post error:", err);
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsUploading(false);
      // inputをリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 日付ラベルを返す
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const toDay = (d: Date) => d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

    if (toDay(date) === toDay(today)) return "今日";
    if (toDay(date) === toDay(yesterday)) return "昨日";
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  };

  // イベントフィルタ適用
  const filteredPosts = selectedEventId
    ? (() => {
        const event = EVENTS.find((e) => e.id === selectedEventId);
        if (!event) return posts;
        return posts.filter((post) => {
          const d = toJSTDateString(post.created_at);
          return d >= event.startDate && d <= event.endDate;
        });
      })()
    : posts;

  // 投稿を日付ごとにグループ化
  const postsByDate = filteredPosts.reduce<{ date: string; label: string; posts: PostWithProfile[] }[]>((acc, post) => {
    const dateKey = new Date(post.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
    const existing = acc.find((g) => g.date === dateKey);
    if (existing) {
      existing.posts.push(post);
    } else {
      acc.push({ date: dateKey, label: getDateLabel(post.created_at), posts: [post] });
    }
    return acc;
  }, []);

  // 相対時間を計算
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/80 backdrop-blur-sm dark:border-zinc-800">
        <div className="absolute top-5 right-6 text-xs text-zinc-500 dark:text-zinc-400 select-none">
        v1.1.0
      </div>
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-lg font-bold">YamBoReal.</h1>
        </div>
      </header>

      {/* ログイン状態表示 */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <p className="text-xs text-zinc-500">読み込み中...</p>
        ) : sessionToken && profile ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-xs font-medium text-foreground">
              {profile.display_name}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {profile.crews?.name}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                ゲスト閲覧中
              </p>
            </div>
            <Link
              href="/login"
              className="text-xs text-foreground underline"
            >
              ログイン
            </Link>
          </div>
        )}
      </div>

      {/* イベントフィルターバー */}
      {EVENTS.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedEventId(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedEventId === null
                ? "bg-foreground text-background"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            すべて
          </button>
          {EVENTS.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() =>
                setSelectedEventId((prev) => (prev === event.id ? null : event.id))
              }
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedEventId === event.id
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {event.name}
            </button>
          ))}
        </div>
      )}

      {/* グリッドタイムライン */}
      <main className="px-1 py-1">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">📷</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              まだ投稿がありません
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              カメラボタンから写真を撮ってみましょう
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {postsByDate.map((group) => (
              <div key={group.date}>
                {/* 日付区切り */}
                <div className="sticky top-[49px] z-[5] flex items-center gap-2 bg-background/90 backdrop-blur-sm px-2 py-1.5">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{group.label}</span>
                  <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="grid grid-cols-3 gap-0.5">
                  {group.posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800"
                      onClick={() => setSelectedPost(post)}
                    >
                      <Image
                        src={post.image_url}
                        alt={`${post.profiles?.display_name || "ユーザー"}の投稿`}
                        sizes="33vw"
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        quality={75}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* カメラボタン（固定） */}
      <div className="fixed bottom-10 left-1/2 z-20 -translate-x-1/2">
        <div className="flex flex-col items-center">
          {countdown > 0 ? (
            <div className="mt-2 text-lg font-bold text-foreground">
              {`残り ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`}
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 py-2">
              \ 通知が来たらここをタップ /
            </div>
          )}
          <button
            type="button"
            onClick={handleCameraClick}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${countdown > 0 ? 'bg-foreground text-background' : 'bg-zinc-400 text-zinc-200 cursor-not-allowed'}`}
          >
            {isUploading ? "⏳" : "📸"}
          </button>
        </div>
        {/* カメラを起動するコード */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* モーダル */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              onClick={() => setSelectedPost(null)}
            >
              ✕
            </button>

            {/* ユーザー情報 */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedPost.profiles?.display_name || "ユーザー"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedPost.profiles?.crews?.name && (
                    <span className="mr-2">{selectedPost.profiles.crews.name}</span>
                  )}
                  {getRelativeTime(selectedPost.created_at)}
                </p>
              </div>
            </div>

            {/* 画像 */}
            <div className="relative w-full">
              <Image
                src={selectedPost.image_url}
                alt={`${selectedPost.profiles?.display_name || "ユーザー"}の投稿`}
                width={800} // 画像の基準サイズ（アスペクト比維持のため必要）
                height={1000}
                className="h-auto w-full object-inherit" // 自動計算
                quality={75}  // 画質設定
                loading="eager"
              />
              {/* ダウンロードボタン（crew_id=13のみ表示） */}
              {profile?.crew_id === 13 && (
                <a
                  href={selectedPost.image_url}
                  download
                  className="absolute bottom-3 right-3 z-20 rounded-full bg-black/70 px-3 py-1 text-xs text-white hover:bg-black/90 transition-colors"
                >
                  写真をダウンロード
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
