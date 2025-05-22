"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // user 테이블에서 이름으로 사용자 찾기
      const { data: users, error } = await supabase
        .from('user')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error

      if (!users) {
        toast({
          title: "로그인 실패",
          description: "해당 이름의 사용자를 찾을 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      // 로그인 성공 시 세션 스토리지에 사용자 정보 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentUser', JSON.stringify(users))
      }
      
      toast({
        title: "로그인 성공",
        description: `${users.username}님 환영합니다!`,
      })

      // 메인 페이지로 리다이렉트
      router.push('/')
    } catch (error) {
      console.error('Error during login:', error)
      toast({
        title: "로그인 실패",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 클라이언트 사이드 렌더링이 완료될 때까지 로딩 상태 표시
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">이름</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="이름을 입력하세요"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
