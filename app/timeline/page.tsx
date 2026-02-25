"use client";

import { uploadImage, createPost, fetchPosts } from "@/lib/api";
import type { PostWithProfile } from "@/lib/database.types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../providers";

export default function TimelinePage() {
  const { user, profile, isLoading, isAnonymous } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostWithProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 投稿一覧を取得
  useEffect(() => {
    const loadPosts = async () => {
      const { data } = await fetchPosts();
      setPosts(data);
    };
    loadPosts();
  }, []);

  // カメラボタンクリック
  const handleCameraClick = () => {
    if (!user) {
      alert("ログインしてください");
      return;
    }
    fileInputRef.current?.click();
  };

  // 写真選択時
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // 画像をアップロード
      const { url, error: uploadError } = await uploadImage(file, user.id);
      if (uploadError || !url) {
        alert("画像のアップロードに失敗しました");
        setIsUploading(false);
        return;
      }

      // 投稿を作成
      const { data: post, error: postError } = await createPost({
        user_id: user.id,
        image_url: url,
      });

      if (postError || !post) {
        alert("投稿の作成に失敗しました");
        setIsUploading(false);
        return;
      }

      // 投稿一覧を再取得
      const { data: updatedPosts } = await fetchPosts();
      setPosts(updatedPosts);

      alert("投稿しました！");
    } catch (err) {
      console.error("Post error:", err);
      alert("エラーが発生しました");
    } finally {
      setIsUploading(false);
      // inputをリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
          >
            ← 戻る
          </Link>
          <h1 className="text-lg font-bold">YamBoReal.</h1>
          <div className="w-10" /> {/* スペーサー */}
        </div>
      </header>

      {/* ログイン状態表示 */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <p className="text-xs text-zinc-500">認証中...</p>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {profile ? (
              <>
                <p className="text-xs font-medium text-foreground">
                  {profile.display_name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {profile.crews?.name}
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {isAnonymous ? "ゲスト" : "ログイン中"}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              未ログイン
            </p>
          </div>
        )}
      </div>

      {/* グリッドタイムライン */}
      <main className="px-1 py-1">
        {posts.length === 0 ? (
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
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800"
                onClick={() => setSelectedPost(post)}
              >
                <Image
                  src={post.image_url}
                  alt={`${post.profiles?.display_name || "ユーザー"}の投稿`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* カメラボタン（固定） */}
      <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isUploading || !user}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-3xl text-background shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isUploading ? "⏳" : "📸"}
        </button>
        {/* 隠しファイル入力（カメラ起動） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
              <div className="h-10 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedPost.profiles?.display_name || "ユーザー"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {getRelativeTime(selectedPost.created_at)}
                </p>
              </div>
            </div>

            {/* 画像 */}
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={selectedPost.image_url}
                alt={`${selectedPost.profiles?.display_name || "ユーザー"}の投稿`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
