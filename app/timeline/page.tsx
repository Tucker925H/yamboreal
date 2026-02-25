"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../providers";

// デモ用の投稿データ
const demoPosts = [
  {
    id: 1,
    username: "tanaka_yuki",
    timestamp: "2分前",
    imageUrl: "https://picsum.photos/seed/post1/400/500",
  },
  {
    id: 2,
    username: "sato_haruka",
    timestamp: "5分前",
    imageUrl: "https://picsum.photos/seed/post2/400/500",
  },
  {
    id: 3,
    username: "yamada_ken",
    timestamp: "12分前",
    imageUrl: "https://picsum.photos/seed/post3/400/500",
  },
  {
    id: 4,
    username: "suzuki_mika",
    timestamp: "18分前",
    imageUrl: "https://picsum.photos/seed/post4/400/500",
  },
  {
    id: 5,
    username: "takahashi_ryo",
    timestamp: "25分前",
    imageUrl: "https://picsum.photos/seed/post5/400/500",
  },
  {
    id: 6,
    username: "watanabe_ai",
    timestamp: "32分前",
    imageUrl: "https://picsum.photos/seed/post6/400/500",
  },
  {
    id: 7,
    username: "ito_sota",
    timestamp: "45分前",
    imageUrl: "https://picsum.photos/seed/post7/400/500",
  },
  {
    id: 8,
    username: "nakamura_yui",
    timestamp: "52分前",
    imageUrl: "https://picsum.photos/seed/post8/400/500",
  },
  {
    id: 9,
    username: "kobayashi_ren",
    timestamp: "1時間前",
    imageUrl: "https://picsum.photos/seed/post9/400/500",
  },
];

type Post = (typeof demoPosts)[number];

export default function TimelinePage() {
  const { user, profile, isLoading, isAnonymous } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-3 gap-0.5">
          {demoPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800"
              onClick={() => setSelectedPost(post)}
            >
              <Image
                src={post.imageUrl}
                alt={`${post.username}の投稿`}
                fill
                className="object-cover transition-transform hover:scale-105"
                unoptimized
              />
            </button>
          ))}
        </div>
      </main>

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
                  {selectedPost.username}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedPost.timestamp}
                </p>
              </div>
            </div>

            {/* 画像 */}
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={selectedPost.imageUrl}
                alt={`${selectedPost.username}の投稿`}
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
