"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { eventBus } from "@/lib/event-bus"

interface User {
  id: string
  username: string
  score: number
  created_at: string
}

export function Leaderboard() {
  const [users, setUsers] = useState<User[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .order("score", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching users:", error)
      return
    }

    setUsers(data || [])
  }

  useEffect(() => {
    fetchUsers()

    // 실시간 구독 설정
    const channel = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user",
        },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    // 신고 이벤트 구독
    eventBus.subscribe("reportSubmitted", fetchUsers)

    return () => {
      supabase.removeChannel(channel)
      eventBus.unsubscribe("reportSubmitted", fetchUsers)
    }
  }, [supabase])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">리더보드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold w-8">{index + 1}</span>
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} />
                  <AvatarFallback>
                    {user.username}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    가입일: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">{user.score}점</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 