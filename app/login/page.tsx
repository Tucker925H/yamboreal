"use client";

import { checkProfileExists, fetchCrews } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Crew } from "@/lib/database.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMode = "select" | "signup" | "signin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("select");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ログイン済みならタイムラインにリダイレクト
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // プロフィールが存在するか確認
        const exists = await checkProfileExists(session.user.id);
        if (exists) {
          router.replace("/timeline");
          return;
        }
      }
      setIsCheckingSession(false);
    };
    checkSession();
  }, [router]);

  // 班一覧を取得（Sign Up時のみ必要だが、事前に読み込んでおく）
  useEffect(() => {
    const loadCrews = async () => {
      const { data } = await fetchCrews();
      setCrews(data);
    };
    loadCrews();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }

    if (!displayName.trim()) {
      setError("表示名を入力してください");
      return;
    }

    if (!selectedCrewId) {
      setError("班を選択してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    // ローカルストレージにプロフィール情報を一時保存（モードも含む）
    localStorage.setItem(
      "pendingProfile",
      JSON.stringify({
        mode: "signup",
        display_name: displayName.trim(),
        crew_id: selectedCrewId,
      })
    );

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (authError) {
      console.error("Magic Link error:", authError);
      localStorage.removeItem("pendingProfile");
      setError("メールの送信に失敗しました。もう一度お試しください。");
      return;
    }

    setIsSent(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Sign Inモードを保存
    localStorage.setItem(
      "pendingProfile",
      JSON.stringify({
        mode: "signin",
      })
    );

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (authError) {
      console.error("Magic Link error:", authError);
      localStorage.removeItem("pendingProfile");
      setError("メールの送信に失敗しました。もう一度お試しください。");
      return;
    }

    setIsSent(true);
  };

  const resetForm = () => {
    setMode("select");
    setEmail("");
    setDisplayName("");
    setSelectedCrewId(null);
    setError(null);
    setIsSent(false);
  };

  // セッション確認中
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </div>
      </div>
    );
  }

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
              onClick={resetForm}
              className="text-sm text-zinc-500 underline hover:text-foreground"
            >
              別のメールアドレスで試す
            </button>
          </div>
        </main>
      </div>
    );
  }

  // モード選択画面
  if (mode === "select") {
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
            <h2 className="mb-2 text-center text-2xl font-bold">ようこそ</h2>
            <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              アカウントをお持ちですか？
            </p>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-opacity hover:opacity-80"
              >
                新規登録（Sign Up）
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full rounded-full border border-foreground bg-transparent py-3 text-base font-medium text-foreground transition-opacity hover:bg-foreground/10"
              >
                ログイン（Sign In）
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Sign In フォーム
  if (mode === "signin") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMode("select")}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              ← 戻る
            </button>
            <h1 className="text-xl font-bold">YamBoReal.</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <h2 className="mb-2 text-center text-2xl font-bold">ログイン</h2>
            <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              登録済みのメールアドレスを入力してください
            </p>

            <form onSubmit={handleSignIn} className="flex flex-col gap-6">
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

              <p className="text-center text-sm text-zinc-500">
                アカウントをお持ちでない方は{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-foreground underline"
                >
                  新規登録
                </button>
              </p>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Sign Up フォーム (mode === "signup")
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode("select")}
            className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold">YamBoReal.</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-center text-2xl font-bold">新規登録</h2>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            情報を入力してください
          </p>

          <form onSubmit={handleSignUp} className="flex flex-col gap-6">
            {/* メールアドレス */}
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

            {/* 表示名 */}
            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: やまだ太郎"
                maxLength={20}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
              />
            </div>

            {/* 班選択 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                班を選択
              </label>
              <div className="grid grid-cols-3 gap-2">
                {crews.map((crew) => (
                  <button
                    key={crew.id}
                    type="button"
                    onClick={() => setSelectedCrewId(crew.id)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                      selectedCrewId === crew.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-zinc-300 bg-white text-foreground hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {crew.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !displayName.trim() || !selectedCrewId}
              className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "送信中..." : "登録リンクを送信"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              すでにアカウントをお持ちの方は{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="text-foreground underline"
              >
                ログイン
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
