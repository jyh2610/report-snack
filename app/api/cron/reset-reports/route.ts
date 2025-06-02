import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const headersList = headers()
  const cronSecret = (await headersList).get('x-cron-secret')

  // 보안을 위한 시크릿 키 확인
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    // 매월 1일인지 확인
    if (today.getDate() === 1) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reset-reports`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset reports')
      }

      return NextResponse.json({ 
        message: 'Reports reset successfully' 
      })
    }

    return NextResponse.json({ 
      message: 'Not the first day of the month' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset reports' },
      { status: 500 }
    )
  }
} 