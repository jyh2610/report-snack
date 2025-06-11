"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import NewChat from "@/components/NewChat"

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
        
        <NewChat />
      </div>
    </div>
  )
}
