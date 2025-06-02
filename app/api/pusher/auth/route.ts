import { NextResponse } from 'next/server'
import Pusher from 'pusher'

// Pusher 설정 로깅
console.log('Pusher 설정:', {
  appId: process.env.PUSHER_APP_ID ? '설정됨' : '미설정',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY ? '설정됨' : '미설정',
  secret: process.env.PUSHER_SECRET ? '설정됨' : '미설정',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ? '설정됨' : '미설정'
})

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
})

export async function POST(request: Request) {
  try {
    // 요청 헤더 로깅
    console.log('인증 요청 헤더:', Object.fromEntries(request.headers.entries()))

    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string
    const channel = formData.get('channel_name') as string
    const userInfo = formData.get('user_info') as string
    const userId = formData.get('user_id') as string

    if (!socketId || !channel) {
      throw new Error('필수 파라미터가 누락되었습니다.')
    }

    console.log('인증 요청 데이터:', { 
      socketId, 
      channel, 
      userInfo,
      userId,
      hasUserInfo: !!userInfo
    })

    const authData = channel.startsWith('presence-') 
      ? {
          user_id: userId,
          user_info: userInfo ? JSON.parse(userInfo) : {}
        }
      : undefined

    console.log('인증 데이터:', authData)

    const authResponse = pusher.authorizeChannel(socketId, channel, authData)
    console.log('인증 응답:', authResponse)

    return new NextResponse(JSON.stringify(authResponse), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
    })
  } catch (error: any) {
    console.error('Pusher 인증 상세 오류:', error)
    return new NextResponse(JSON.stringify({ 
      error: '인증 실패!',
      details: error.message,
      stack: error.stack
    }), {
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 