"use client";
import { useState } from "react";

export default function PushSubscriptionButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    if (!('serviceWorker' in navigator)) {
      alert('Service Worker未対応');
      setLoading(false);
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      alert('VAPID公開鍵が未設定です');
      setLoading(false);
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    // Supabaseに保存するAPI呼び出し
    await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
    setSubscribed(true);
    setLoading(false);
  }

  // VAPID公開鍵をUint8Arrayに変換
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <button
      disabled={loading || subscribed}
      onClick={subscribe}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        padding: "12px 24px",
        background: subscribed ? "#aaa" : "#007aff",
        color: "#fff",
        borderRadius: "8px",
        fontWeight: "bold",
        border: "none",
        cursor: loading || subscribed ? "not-allowed" : "pointer",
      }}
    >
      {subscribed ? "通知購読済み" : loading ? "購読中..." : "Push通知購読"}
    </button>
  );
}
