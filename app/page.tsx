"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trophy } from "lucide-react"

interface Snack {
  name: string
  brand: string
  calories: number
  image?: string
}

interface MonthlyWinner {
  id: string
  username: string
  score: number
  month: number
}

export default function SnackBook() {
  const [searchQuery, setSearchQuery] = useState("")
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(false)
  const [monthlyWinner, setMonthlyWinner] = useState<MonthlyWinner | null>(null)

  useEffect(() => {
    fetchMonthlyWinner()
  }, [])

  const fetchMonthlyWinner = async () => {
    try {
      const response = await fetch('/api/monthly-winner')
      const data = await response.json()
      setMonthlyWinner(data)
    } catch (error) {
      console.error('월간 우승자 정보를 가져오는데 실패했습니다:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/snack-search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSnacks(data)
    } catch (error) {
      console.error('간식 검색 중 오류 발생:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">간식 도감</h1>

        {monthlyWinner && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {monthlyWinner.month}월의 왕
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {monthlyWinner.username}님
                  </CardDescription>
                </div>
                <Trophy className="h-12 w-12" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                총 점수: {monthlyWinner.score}점
              </p>
            </CardContent>
          </Card>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snacks.map((snack, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{snack.name}</CardTitle>
                <CardDescription>{snack.brand}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    칼로리: {snack.calories}kcal
                  </p>
                  {snack.image && (
                    <img 
                      src={snack.image} 
                      alt={snack.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
