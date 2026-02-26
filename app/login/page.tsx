"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [crewId, setCrewId] = useState("");
  const [crews, setCrews] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 班一覧を取得
  useEffect(() => {
    fetch("/api/crews")
      .then((res) => res.json())
      .then((data) => setCrews(data));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) {
      setError("表示名を入力してください");
      return;
    }
    if (!crewId) {
      setError("班を選択してください");
      return;
    }
    setIsLoading(true);
    // profiles検索
    const res = await fetch("/api/simple-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName.trim(), crew_id: crewId }),
    });
    const data = await res.json();
    if (!data || !data.session_token) {
      setError(data.error || "ログインに失敗しました");
      setIsLoading(false);
      return;
    }
    // session_token保存
    localStorage.setItem("session_token", data.session_token);
    // Providersに即時反映させるためイベント発火
    window.dispatchEvent(new Event("yam-auth-refresh"));
    setIsLoading(false);
    router.replace("/timeline");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-xs space-y-6">
        <h1 className="text-2xl font-bold">シンプルログイン</h1>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="表示名"
          className="w-full rounded border px-3 py-2"
        />
        <select
          value={crewId}
          onChange={(e) => setCrewId(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">班を選択</option>
          {crews.map((crew) => (
            <option key={crew.id} value={crew.id}>
              {crew.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-blue-600 py-2 text-white font-bold"
        >
          {isLoading ? "処理中..." : "ログイン"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
    </main>
  );
}
