import { useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function sendPush() {
    setLoading(true);
    setResult("");
    const res = await fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.ADMIN_SECRET || "admin",
      },
      body: JSON.stringify({
        title: "今すぐ撮影！",
        body: "2分以内に撮影をしよう！",
        url: "/timeline",
      }),
    });
    const data = await res.json();
    setResult(data.success ? "通知送信成功" : data.error || "通知送信失敗");
    setLoading(false);
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>管理者通知送信ページ</h1>
      <button onClick={sendPush} disabled={loading} style={{ fontSize: 18, padding: "12px 24px" }}>
        {loading ? "送信中..." : "全員に通知を送信"}
      </button>
      <div style={{ marginTop: 16, color: "#007aff" }}>{result}</div>
    </div>
  );
}
