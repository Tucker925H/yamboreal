"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_NEXT_PATH = "/timeline";

const getSafeNextPath = (value: string | null): string => {
  if (!value) return DEFAULT_NEXT_PATH;
  if (!value.startsWith("/")) return DEFAULT_NEXT_PATH;
  if (value.startsWith("//")) return DEFAULT_NEXT_PATH;
  return value;
};

export default function AccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextPath, setNextPath] = useState(DEFAULT_NEXT_PATH);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("next");
    setNextPath(getSafeNextPath(value));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("パスワードを入力してください。");
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/access-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "認証に失敗しました。");
      setIsLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6">
        <h1 className="text-2xl font-bold">アクセス制限</h1>
        <p className="text-sm text-zinc-500">
          このサイトを表示するにはパスワードが必要です。
        </p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="パスワード"
          autoComplete="current-password"
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-blue-600 py-2 text-white font-bold"
        >
          {isLoading ? "認証中..." : "認証する"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
    </main>
  );
}
