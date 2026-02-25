"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (authError) {
      console.error("Magic Link error:", authError);
      setError("メールの送信に失敗しました。もう一度お試しください。");
      return;
    }

    setIsSent(true);
  };

  // 送信成功画面
  if (isSent) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <h1 className="text-center text-xl font-bold">YamBoReal.</h1>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm text-center">
            <div className="mb-6 text-5xl">📧</div>
            <h2 className="mb-2 text-2xl font-bold">メールを送信しました</h2>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-foreground">{email}</span>
              <br />
              に認証リンクを送信しました。
              <br />
              メールを確認してリンクをクリックしてください。
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
              className="text-sm text-zinc-500 underline hover:text-foreground"
            >
              別のメールアドレスで試す
            </button>
          </div>
        </main>
      </div>
    );
  }

  // メール入力フォーム
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
          >
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold">YamBoReal.</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-center text-2xl font-bold">ログイン</h2>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            メールアドレスを入力してください
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "送信中..." : "ログインリンクを送信"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
