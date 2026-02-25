"use client";

import { createProfile, checkProfileExists } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Callback started");
        console.log("URL:", window.location.href);
        
        // PKCE flow: URLのクエリパラメータからcodeを取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        // Hash flow: URLのハッシュからトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        console.log("Code:", code);
        console.log("AccessToken:", accessToken ? "exists" : "none");

        if (code) {
          // PKCE flow: codeをセッションに交換
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Exchange error:", exchangeError);
            setStatus("error");
            setErrorMessage("認証コードの処理に失敗しました");
            return;
          }
          console.log("Code exchanged successfully");
        } else if (accessToken && refreshToken) {
          // Implicit flow: セッションを設定
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Session error:", sessionError);
            setStatus("error");
            setErrorMessage("セッションの確立に失敗しました");
            return;
          }
          console.log("Session set successfully");
        }

        // 現在のユーザーを取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("User:", user?.id, "Error:", userError);

        if (userError || !user) {
          console.error("User error:", userError);
          setStatus("error");
          setErrorMessage("ユーザー情報の取得に失敗しました");
          return;
        }

        // ローカルストレージからプロフィール情報を取得
        const pendingProfileStr = localStorage.getItem("pendingProfile");
        console.log("PendingProfile:", pendingProfileStr);
        
        if (!pendingProfileStr) {
          // 情報がない場合はタイムラインへ
          console.log("No pending profile, redirecting to timeline");
          router.replace("/timeline");
          return;
        }

        const pendingProfile = JSON.parse(pendingProfileStr);
        const profileExists = await checkProfileExists(user.id);
        console.log("ProfileExists:", profileExists);

        // Sign Up モードの場合
        if (pendingProfile.mode === "signup") {
          if (profileExists) {
            localStorage.removeItem("pendingProfile");
            setStatus("error");
            setErrorMessage("このメールアドレスは既に登録されています。ログインしてください。");
            return;
          }

          const { success, error: profileError } = await createProfile({
            uuid: user.id,
            display_name: pendingProfile.display_name,
            crew_id: pendingProfile.crew_id,
          });

          if (!success) {
            console.error("Profile creation error:", profileError);
            localStorage.removeItem("pendingProfile");
            setStatus("error");
            setErrorMessage("プロフィールの作成に失敗しました");
            return;
          }
          console.log("Profile created successfully");
        }

        // Sign In モードの場合
        if (pendingProfile.mode === "signin") {
          if (!profileExists) {
            localStorage.removeItem("pendingProfile");
            setStatus("error");
            setErrorMessage("このメールアドレスは登録されていません。新規登録してください。");
            return;
          }
        }

        localStorage.removeItem("pendingProfile");
        console.log("Redirecting to timeline");
        router.replace("/timeline");
      } catch (e) {
        console.error("Callback error:", e);
        setStatus("error");
        setErrorMessage("認証処理中にエラーが発生しました");
      }
    };

    handleCallback();
  }, [router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h1 className="mb-2 text-xl font-bold">エラーが発生しました</h1>
          <p className="mb-6 text-sm text-zinc-500">{errorMessage}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-zinc-500 underline hover:text-foreground"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">⏳</div>
        <h1 className="mb-2 text-xl font-bold">認証処理中...</h1>
        <p className="text-sm text-zinc-500">しばらくお待ちください</p>
      </div>
    </div>
  );
}
