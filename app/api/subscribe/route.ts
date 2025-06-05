// pages/api/subscribe.js
import { NextResponse } from 'next/server'
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, keys } = body

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert([{ endpoint, keys }])

    if (error) throw error

    return NextResponse.json({ message: "구독이 완료되었습니다" })
  } catch (error) {
    console.error("구독 처리 중 오류:", error)
    return NextResponse.json(
      { error: "구독 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
