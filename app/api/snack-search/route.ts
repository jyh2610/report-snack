import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 })
  }

  try {
    // 여기에 실제 간식 검색 API 호출 로직을 구현하세요
    // 예시 응답:
    const mockData = [
      {
        name: "바나나킥",
        brand: "농심",
        calories: 120,
        image: "https://example.com/bananakick.jpg"
      },
      // 더 많은 간식 데이터...
    ]

    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json(
      { error: '간식 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 