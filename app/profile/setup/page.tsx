"use client";

import { checkProfileExists, createProfile, fetchCrews } from "@/lib/api";
import type { Crew } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../providers";

export default function ProfileSetupPage() {
  const { sessionToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [crews, setCrews] = useState<Crew[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 班一覧を取得
  useEffect(() => {
    const loadCrews = async () => {
      const { data, error } = await fetchCrews();

      if (error) {
        setError("班の取得に失敗しました");
      } else {
        setCrews(data);
      }
    };

    loadCrews();
  }, []);

  // 既にプロフィールがあるか確認
  useEffect(() => {
    const checkProfile = async () => {
      if (!sessionToken) return;

      const exists = await checkProfileExists(sessionToken);

      if (exists) {
        // 既にプロフィールがある場合はタイムラインへ
        router.replace("/timeline");
      }
    };

    checkProfile();
  }, [sessionToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionToken) {
      setError("ログインが必要です");
      return;
    }

    if (!displayName.trim()) {
      setError("名前を入力してください");
      return;
    }

    if (!selectedCrewId) {
      setError("班を選択してください");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { success, error: createError } = await createProfile({
      session_token: sessionToken ?? "",
      display_name: displayName.trim(),
      crew_id: selectedCrewId,
    });

    if (!success) {
      setError("プロフィールの作成に失敗しました");
      setIsSubmitting(false);
      return;
    }

    // 成功したらタイムラインへ
    router.push("/timeline");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ヘッダー */}
      <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <h1 className="text-center text-xl font-bold">YamBoReal.</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-center text-2xl font-bold">
            プロフィール設定
          </h2>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            名前と班を登録してください
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 名前入力 */}
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

            {/* エラー表示 */}
            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim() || !selectedCrewId}
              className="w-full rounded-full bg-foreground py-3 text-base font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "登録中..." : "登録してはじめる"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
