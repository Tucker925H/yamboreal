"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers";

export default function Home() {
  const { sessionToken, isLoading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoading && sessionToken) {
  //     router.replace("/timeline");
  //   }
  // }, [isLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 relative">
      {/* バージョン表示 */}
      <div className="absolute top-4 right-6 text-xs text-zinc-500 dark:text-zinc-400 select-none">
        v1.2.0
      </div>
      {/* ヒーローセクション */}
      <div className="flex flex-col items-center text-center">
        {/* アプリ名 */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          YamBoReal.
        </h1>

        {/* 説明文 */}
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          通知が来たら2分以内に今を撮ろう。
        </p>

        {/* ボタン */}
        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-full bg-foreground py-3 text-center text-base font-medium text-background transition-opacity hover:opacity-80"
          >
            ログイン
          </Link>
          <Link
            href="/timeline"
            className="w-full rounded-full border border-zinc-300 bg-transparent py-3 text-center text-base font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            タイムラインを見る
          </Link>
        </div>
      </div>
    </main>
  );
}
