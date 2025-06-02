import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const today = new Date()
    
    const { data, error } = await supabase
      .from('user')
      .select('id, username, score')
      .gte('score', 0)  // 0점 이상인 사용자만 선택
      .order('score', { ascending: false })

    if (error) throw error

    // API 응답 구조 수정
    return NextResponse.json({
      winners: data || [], // 데이터가 없을 경우 빈 배열 반환
      month: today.getMonth() + 1
    })
  } catch (error) {
    return NextResponse.json(
      { 
        winners: [], // 에러 발생 시에도 빈 배열 반환
        month: new Date().getMonth() + 1 
      },
      { status: 500 }
    )
  }
} 