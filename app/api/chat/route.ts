import { NextResponse } from 'next/server'
import Pusher from 'pusher'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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
    
    // Supabase에 채팅 로그 저장
    const { error } = await supabase
      .from('chatlog')
      .insert({
        id: message.id,
        content: message.content,
        sender: message.sender,
        nickname: message.nickname,
        timestamp: message.timestamp
      })

    if (error) throw error
    
    // Pusher로 메시지 전송
    await pusher.trigger('presence-chat', 'message', message)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('메시지 전송 중 오류:', error)
    return NextResponse.json(
      { error: '메시지 전송 실패' },
      { status: 500 }
    )
  }
}

// 전체 채팅 로그 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    
    const { data, error } = await supabase
      .from('chatlog')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit ? parseInt(limit) : 50)

    if (error) throw error
    
    return NextResponse.json(data.reverse())
  } catch (error) {
    console.error('채팅 로그 조회 중 오류:', error)
    return NextResponse.json(
      { error: '채팅 로그 조회 실패' },
      { status: 500 }
    )
  }
}

// 채팅 로그 삭제
export async function DELETE() {
  try {
    const { error } = await supabase
      .from('chatlog')
      .delete()
      .lt('timestamp', Date.now() - 3 * 60 * 60 * 1000) // 3시간 이전 데이터 삭제

    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('채팅 로그 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '채팅 로그 삭제 실패' },
      { status: 500 }
    )
  }
} 