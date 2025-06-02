/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { eventBus } from "@/lib/event-bus"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import FindKcal from "./findKcal"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
}

interface FoodData {
  foodNm: string
  kcal: number
  protein: number
  fat: number
  carbohydrate: number
}

export function ReportForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: "",
    snack_kind: "",
    location: "",
    date: "",
    description: "",
    informant: "",
  })
  const [reportedUserId, setReportedUserId] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [foodData, setFoodData] = useState<FoodData | null>(null)

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

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }))
  }

  const handleFoodSelect = (selectedFood: FoodData) => {
    setFoodData(selectedFood)
    setSuccess(false)
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
          id: users.find((user) => user.username === formData.name)?.id,
          kcal: foodData?.kcal || 0,
          protein: foodData?.protein || 0,
          fat: foodData?.fat || 0,
          carbohydrate: foodData?.carbohydrate || 0,
          informant: formData.informant,
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

      // 데스크탑 알림
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("신고 알림", {
            body: `${formData.name}님이 새로운 신고를 했습니다!`,
            icon: "/icon.png",
          });
        }
      }

      // 신고 성공 시 이벤트 발생
      eventBus.emit("reportSubmitted")
      
      // Reset form
      setFormData({
        name: "",
        snack_kind: "",
        location: "",
        date: "",
        description: "",
        informant: "",
      })
      setFoodData(null)

      // 페이지 새로고침
      router.refresh()
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>간식 신고하기</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="informant">제보자</Label>
              <Input
                id="informant"
                name="informant"
                value={formData.informant}
                onChange={handleChange}
                required
                placeholder="제보자 이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="snack_kind">어떤 간식을 먹었나요?</Label>
              <div className="flex gap-2">
                <Input
                  id="snack_kind"
                  name="snack_kind"
                  placeholder="예: 초콜릿, 과자, 아이스크림 등"
                  value={formData.snack_kind}
                  onChange={handleChange}
                  required
                />
                <Button 
                  type="button" 
                  onClick={() => setSuccess(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  칼로리 찾기
                </Button>
              </div>
            </div>

            {foodData && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold mb-2">영양 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>음식명: {foodData.foodNm}</div>
                  <div>칼로리: {foodData.kcal}kcal</div>
                  <div>단백질: {foodData.protein}g</div>
                  <div>지방: {foodData.fat}g</div>
                  <div>탄수화물: {foodData.carbohydrate}g</div>
                </div>
              </div>
            )}

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
                className="min-h-[100px]"
              />
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              <CakeIcon className="mr-2 h-4 w-4" />
              {isSubmitting ? "제출 중..." : "신고하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>칼로리 찾기</DialogTitle>
          </DialogHeader>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[50vh] overflow-y-auto">
            <FindKcal 
              foodNm={formData.snack_kind} 
              onSelect={handleFoodSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
