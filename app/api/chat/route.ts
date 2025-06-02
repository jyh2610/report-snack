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
    const message = await request.json()
    
    await pusher.trigger('chat', 'message', message)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Pusher 메시지 전송 중 오류:', error)
    return NextResponse.json(
      { error: '메시지 전송 실패' },
      { status: 500 }
    )
  }
} 