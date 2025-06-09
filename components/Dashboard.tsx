"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  username: string
}

export default function Board() {
  const { toast } = useToast()
  const { currentUser } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState({ title: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("dashboard")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "게시글을 불러오는데 실패했습니다",
        variant: "destructive",
      })
      return
    }

    setPosts(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("posts").insert([
        {
          title: newPost.title,
          content: newPost.content,
          user_id: currentUser.id,
          username: currentUser.username,
        },
      ])

      if (error) throw error

      toast({
        title: "게시글이 작성되었습니다",
      })

      setNewPost({ title: "", content: "" })
      fetchPosts()
    } catch (error) {
      toast({
        title: "게시글 작성에 실패했습니다",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">게시판</h1>

      {currentUser && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>새 게시글 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="제목"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <Textarea
                placeholder="내용"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="min-h-[100px]"
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "작성 중..." : "작성하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{post.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {post.username} •{" "}
                      {format(new Date(post.created_at), "PPP", { locale: ko })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <p className="text-lg">아직 작성된 게시글이 없습니다</p>
                {!currentUser && (
                  <p className="text-sm mt-2">
                    게시글을 작성하려면 로그인이 필요합니다
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}