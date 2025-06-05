// pages/api/report.ts
import type { NextApiRequest, NextApiResponse } from "next"
import webpush from "web-push"
import { supabase } from "@/lib/supabase"

interface ReportPayload {
  name: string
  snack_kind: string
  location: string
  date: string
  description: string
  informant: string
  id: string
  kcal: number
  protein: number
  fat: number
  carbohydrate: number
}

interface PushRow {
  id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const privateKey = process.env.VAPID_PRIVATE_KEY!
webpush.setVapidDetails("mailto:admin@your-domain.com", publicKey, privateKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const {
      name,
      snack_kind,
      location,
      date,
      description,
      informant,
      id,
      kcal,
      protein,
      fat,
      carbohydrate,
    } = req.body as ReportPayload

    const { data: insertedReport, error: insertError } = await supabase
      .from("report")
      .insert([
        {
          name,
          snack_kind,
          location,
          date,
          description,
          id,
          kcal,
          protein,
          fat,
          carbohydrate,
          informant,
        },
      ])
      .select()
      .single()
    if (insertError) throw insertError

    const { error: updateScoreError } = await supabase.rpc("increment_user_score", {
      user_id: insertedReport.id,
    })
    if (updateScoreError) throw updateScoreError

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
    if (subError) throw subError

    const payload = JSON.stringify({
      title: "[새 간식 신고 접수]",
      body: `${name}님이 "${snack_kind}"을(를) 신고했습니다.`,
      icon: "/icon-192x192.png",
      url: "/admin/reports",
    })

    const sendPromises = subscriptions!.map((row) => {
      const pushSubscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.keys.p256dh,
          auth: row.keys.auth,
        },
      }

      return webpush.sendNotification(pushSubscription, payload).catch((err: any) => {
        console.error("푸시 전송 실패:", err)
        if (err.statusCode === 410 || err.statusCode === 404) {
          return supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", row.endpoint)
            .then(() => console.log("만료된 구독 삭제:", row.endpoint))
        }
      })
    })

    await Promise.all(sendPromises)
    return res.status(200).json({ message: "신고 접수 및 푸시 알림 전송 완료" })
  } catch (error) {
    console.error("API/report 에러:", error)
    return res.status(500).json({ error: "서버 오류. 다시 시도해주세요." })
  }
}
