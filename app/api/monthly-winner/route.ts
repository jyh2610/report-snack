import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const { data, error } = await supabase
      .from('user')
      .select('id, username, score')
      .order('score', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return NextResponse.json({
      winner: data,
      month: today.getMonth() + 1
    })
  } catch (error) {
    return NextResponse.json(
      { error: '월간 우승자 정보를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
} 