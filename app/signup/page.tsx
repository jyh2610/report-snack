"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 이미 존재하는지 확인
      const { data: exist, error: existError } = await supabase
        .from('user')
        .select('*')
        .eq('username', username)
        .single()

      if (exist && !existError) {
        toast({
          title: "회원가입 실패",
          description: "이미 존재하는 이름입니다.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 새 유저 추가
      const { error } = await supabase
        .from('user')
        .insert([{ username, score: 0 }])

      if (error) throw error

      toast({
        title: "회원가입 성공",
        description: `${username}님 환영합니다!`,
      })

      // 로그인 페이지로 이동
      router.push('/login')
    } catch (error) {
      console.error('Error during signup:', error)
      toast({
        title: "회원가입 실패",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              로그인으로 돌아가기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
