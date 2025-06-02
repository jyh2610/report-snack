"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

interface Snack {
  prdlstNm: string
  mnfcturCo: string
  nutrient: string  // 영양성분 정보
  imgUrl1?: string
}

interface MonthlyWinner {
  id: string
  username: string
  score: number
}

interface MonthlyWinners {
  winners: MonthlyWinner[]
  month: number
}

export default function SnackBook() {
  const [searchQuery, setSearchQuery] = useState("")
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(false)
  const [monthlyWinners, setMonthlyWinners] = useState<MonthlyWinners | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    fetchMonthlyWinner()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("reports_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "report",
        },
        (payload) => {
          const reportUser = payload.new.name;
          showReportNotification(reportUser);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMonthlyWinner = async () => {
    try {
      const response = await fetch('/api/monthly-winner')
      const data = await response.json()
      setMonthlyWinners(data)
    } catch (error) {
      console.error('월간 우승자 정보를 가져오는데 실패했습니다:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/getKcal?foodNm=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('음식 정보를 불러오지 못했습니다.')
      const data = await response.json()
      const items = data.body?.items?.item || []
      setSnacks(Array.isArray(items) ? items : [items])
    } catch (error) {
      console.error('간식 검색 중 오류 발생:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNutrient = (nutrient: string | undefined) => {
    if (!nutrient) return new Map<string, string>()
    
    // 영양성분 문자열을 파싱하여 객체로 변환
    const nutrientMap = new Map<string, string>()
    
    try {
      // 콤마로 구분된 각 영양소 정보를 처리
      nutrient.split(',').forEach(item => {
        const [key, value] = item.trim().split(/(?<=[가-힣])\s+/)
        if (key && value) {
          nutrientMap.set(key, value)
        }
      })
    } catch (error) {
      console.error('영양성분 파싱 중 오류:', error)
    }

    return nutrientMap
  }

  function showReportNotification(reportUser: string) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("신고 알림", {
          body: `${reportUser}님이 새로운 신고를 했습니다!`,
          icon: "/icon.png", // 원하는 아이콘 경로
        });
      }
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">간식 도감</h1>

        {monthlyWinners ? (
          monthlyWinners.winners.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">
                {monthlyWinners.month}월의 왕들
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyWinners.winners.map((winner) => (
                  <Card key={winner.id} className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {winner.username}님
                          </CardTitle>
                          <CardDescription className="text-white/80">
                            {winner.score}점
                          </CardDescription>
                        </div>
                        <Trophy className="h-8 w-8" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mb-8">
          <Input
            placeholder="찾고 싶은 간식을 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            검색
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="flex-none">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <Skeleton className="aspect-video w-full rounded-md" />
                    <div className="bg-muted/50 rounded-lg p-4">
                      <Skeleton className="h-5 w-48 mb-3" />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {snacks.map((snack, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="flex-none">
                  <CardTitle className="text-lg">{snack.prdlstNm}</CardTitle>
                  <CardDescription>{snack.mnfcturCo}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    {snack.imgUrl1 && (
                      <div className="relative aspect-video">
                        <img 
                          src={snack.imgUrl1} 
                          alt={snack.prdlstNm}
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                        />
                      </div>
                    )}
                    {snack.nutrient && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3 text-sm">영양성분 (1회 제공량당 함량)</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {Array.from(formatNutrient(snack.nutrient)).map(([key, value], index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-muted-foreground truncate">{key}</span>
                              <span className="font-medium ml-2">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {snacks.length === 0 && !loading && (
          <div className="text-center text-muted-foreground mt-8">
            검색어를 입력하여 간식 정보를 찾아보세요
          </div>
        )}

        {loading && (
          <div className="text-center mt-8">
            검색 중...
          </div>
        )}
      </div>
    </div>
  )
}
