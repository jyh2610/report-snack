// components/PushSubscriber.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export default function PushSubscriber() {
  const { toast } = useToast()
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    return new Uint8Array(rawData.split("").map((char) => char.charCodeAt(0)))
  }

  const subscribePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "이 브라우저는 푸시 알림을 지원하지 않습니다.", variant: "destructive" })
      return
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker 등록 성공:", registration)

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({ title: "알림 권한이 필요합니다.", variant: "destructive" })
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey,
      })
      console.log("Push Subscription:", subscription)

      const keys = (subscription.toJSON() as any).keys as PushSubscriptionKeys

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert([
          {
            endpoint: subscription.endpoint,
            keys: keys,
          },
        ])
      if (error) throw error

      toast({ title: "푸시 구독이 완료되었습니다 ✅" })
      setSubscribed(true)
    } catch (err) {
      console.error("구독 생성 중 오류:", err)
      toast({
        title: "푸시 구독 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((existingSub) => {
          if (existingSub) setSubscribed(true)
        })
      })
    }
  }, [])

  return (
    <div className="mb-6">
      {subscribed ? (
        <p className="text-sm text-green-600">✅ 이미 푸시 구독됨</p>
      ) : (
        <button
          onClick={subscribePush}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          푸시 알림 구독하기
        </button>
      )}
    </div>
  )
}
