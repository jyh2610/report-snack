import { NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
})

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const socketId = data.socket_id
    const channel = data.channel_name
    const userInfo = data.user_info

    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: data.user_id,
      user_info: userInfo
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher 인증 중 오류:', error)
    return NextResponse.json(
      { error: '인증 실패' },
      { status: 403 }
    )
  }
} 