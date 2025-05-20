/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CakeIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  username: string
}

export function ReportForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: "",
    snack_kind: "",
    location: "",
    date: "",
    description: "",
  })

  useEffect(() => {

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('user')
        .select('*')
 
      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }
      
      console.log('Fetched users:', users)
      setUsers(users || [])
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      toast({
        title: "사용자 목록을 불러오는데 실패했습니다",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

    fetchUsers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. report 테이블에 신고 저장
      const { data: reportData, error: reportError } = await supabase
        .from('report')
        .insert([{
          name: formData.name,
          snack_kind: formData.snack_kind,
          location: formData.location,
          date: formData.date,
          description: formData.description,
          id: users.find((user) => user.username === formData.name)?.id
        }])
        .select()

      if (reportError) throw reportError

      // 2. user 테이블의 score 업데이트
      const { error: updateError } = await supabase
        .rpc('increment_user_score', { user_id: reportData[0].id })

      if (updateError) throw updateError

      toast({
        title: "신고가 접수되었습니다!",
        description: `${formData.name}님의 간식 섭취가 성공적으로 신고되었습니다.`,
      })

      // Reset form
      setFormData({
        name: "",
        snack_kind: "",
        location: "",
        date: "",
        description: "",
      })
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: "오류가 발생했습니다",
        description: "신고 접수 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">누구를 신고하시나요?</Label>
            <Select onValueChange={handleUserSelect} value={formData.name}>
              <SelectTrigger>
                <SelectValue placeholder="사용자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.username}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="snack_kind">어떤 간식을 먹었나요?</Label>
            <Input
              id="snack_kind"
              name="snack_kind"
              placeholder="예: 초콜릿, 과자, 아이스크림 등"
              value={formData.snack_kind}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">어디서 먹었나요?</Label>
              <Input
                id="location"
                name="location"
                placeholder="장소"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">언제 먹었나요?</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">상세 내용</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="상황을 자세히 설명해주세요..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            <CakeIcon className="mr-2 h-4 w-4" />
            신고하기
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
