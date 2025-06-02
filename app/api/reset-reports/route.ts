import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // report 테이블의 모든 데이터 삭제
    const { error } = await supabase
      .from('report')
      .delete()
      .neq('id', 0) // 모든 레코드 삭제

    if (error) throw error

    return NextResponse.json({ 
      message: 'report 테이블이 성공적으로 초기화되었습니다' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'report 테이블 초기화 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 