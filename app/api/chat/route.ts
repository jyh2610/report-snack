'use client'

import { NextResponse } from 'next/server'
import Pusher from 'pusher'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Supabase 클라이언트 설정 로깅
console.log('Supabase 설정:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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

// userId를 useRef로만 쓰지 말고, localStorage에도 저장
const [userId, setUserId] = useState<string | null>(null)

useEffect(() => {
  let savedId = localStorage.getItem('chatUserId')
  if (!savedId) {
    savedId = uuidv4()
    localStorage.setItem('chatUserId', savedId)
  }
  setUserId(savedId)
}, [])

export async function POST(request: Request) {
  try {
    const message = await request.json()
    console.log('받은 메시지:', message)

    // 필수 필드 검증
    const requiredFields = ['id', 'content', 'sender', 'nickname']
    const missingFields = requiredFields.filter(field => !message[field])
    
    if (missingFields.length > 0) {
      throw new Error(`필수 메시지 필드가 누락되었습니다: ${missingFields.join(', ')}`)
    }

    // Supabase에 채팅 로그 저장
    const { error: supabaseError } = await supabase
      .from('chatlog')
      .insert({
        message_id: message.id,
        content: message.content,
        sender: message.sender,
        nickname: message.nickname,
        timestamp: message.timestamp || Date.now()
      })

    if (supabaseError) {
      console.error('Supabase 저장 오류:', supabaseError)
      throw new Error(`Supabase 저장 실패: ${supabaseError.message}`)
    }
    
    // Pusher로 메시지 전송
    try {
      const pusherResponse = await pusher.trigger('presence-chat', 'message', message)
      console.log('Pusher 전송 응답:', pusherResponse)
    } catch (pusherError: any) {
      console.error('Pusher 전송 오류:', pusherError)
      throw new Error(`Pusher 전송 실패: ${pusherError.message}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('메시지 전송 중 오류:', error)
    return NextResponse.json(
      { 
        error: '메시지 전송 실패',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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

    if (error) {
      console.error('Supabase 조회 오류:', error)
      throw error
    }
    
    // message_id를 id로 변환
    const mapped = (data ?? []).map(row => ({
      id: row.message_id,
      content: row.content,
      sender: row.sender,
      nickname: row.nickname,
      timestamp: row.timestamp,
    }));

    return NextResponse.json(mapped.reverse())
  } catch (error: any) {
    console.error('채팅 로그 조회 중 오류:', error)
    return NextResponse.json(
      { 
        error: '채팅 로그 조회 실패',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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