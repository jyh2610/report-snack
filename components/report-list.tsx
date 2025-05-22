"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CakeIcon, ClockIcon, MapPinIcon, MessageSquareIcon, UserIcon, ThumbsUpIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export interface Report {
  name: string;
  snack_kind: string;
  location: string;
  date: string;
  description: string;
  id: string;
  objection?: string;
  informant: string;
  agreements?: { [key: string]: boolean };
}

export function ReportList() {
  const router = useRouter()
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [objection, setObjection] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true)
    // 세션 스토리지에서 현재 사용자 정보 가져오기
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
  }, [])

  const fetchUsers = async () => {
    const { data: users, error } = await supabase
      .from('user')
      .select('*')
    if (error) {
      console.error('Error fetching users:', error)
      return
    }
    setUsers(users || [])
  }

  const fetchReports = async () => {
    const { data: report, error } = await supabase
      .from('report')
      .select('*')
    if (error) {
      console.error('Error fetching reports:', error)
    }
    setReports(report || [])
  }

  const handleObjectionSubmit = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "이의제기를 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      setIsDialogOpen(false)
      return
    }

    try {
      const { error } = await supabase
        .from('report')
        .update({ 
          objection,
          objection_by: currentUser.username // 이의제기 작성자 추가
        })
        .eq('id', reportId);

      if (error) throw error;

      setObjection("");
      setIsDialogOpen(false);
      fetchReports();
      toast({
        title: "이의제기 제출 완료",
        description: "이의제기가 성공적으로 제출되었습니다.",
      })
    } catch (error) {
      console.error('Error submitting objection:', error);
      toast({
        title: "이의제기 제출 실패",
        description: "이의제기를 제출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  };

  const handleAgree = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "이의제기에 동의하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }

    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) return

      const currentAgreements = report.agreements || {}
      if (currentAgreements[currentUser.id]) {
        toast({
          title: "이미 동의하셨습니다",
          description: "이 이의제기에 이미 동의하셨습니다.",
        })
        return
      }

      const newAgreements = {
        ...currentAgreements,
        [currentUser.id]: true
      }
      
      const agreedCount = Object.keys(newAgreements).length
      if (agreedCount === users.length) {
        const { error: deleteError } = await supabase
          .from('report')
          .delete()
          .eq('id', reportId)

        if (deleteError) throw deleteError

        toast({
          title: "신고가 삭제되었습니다",
          description: "모든 사용자의 동의로 신고가 삭제되었습니다.",
        })
      } else {
        const { error: updateError } = await supabase
          .from('report')
          .update({ agreements: newAgreements })
          .eq('id', reportId)

        if (updateError) throw updateError

        toast({
          title: "동의 완료",
          description: "이의제기에 동의하셨습니다.",
        })
      }

      fetchReports()
    } catch (error) {
      console.error('Error agreeing to objection:', error)
      toast({
        title: "동의 실패",
        description: "이의제기에 동의하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (mounted) {
      fetchUsers()
      fetchReports()

      const channel = supabase
        .channel('reports_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'report',
          },
          () => {
            fetchReports()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [mounted])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">아직 신고 내역이 없습니다.</CardContent>
        </Card>
      ) : (
        reports.map((report, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 bg-green-100 text-green-600">
                  <AvatarFallback>{report.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <UserIcon className="h-3 w-3" />
                        <span>제보자: {report.informant}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.date}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium flex items-center gap-1 mb-1">
                    <CakeIcon className="h-3.5 w-3.5 text-red-500" />
                    <span>{report.snack_kind}</span>
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    <span className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {report.location}
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {new Date(report.date).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {report.description && <p className="text-sm text-gray-600 mt-2 border-t pt-2">{report.description}</p>}
                  
                  {report.objection && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">이의제기</p>
                          <p className="text-xs text-gray-500">작성자: {report.objection}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {Object.keys(report.agreements || {}).length}/{users.length}명 동의
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleAgree(report.id)}
                            disabled={!currentUser || (report.agreements || {})[currentUser.id]}
                          >
                            <ThumbsUpIcon className="h-4 w-4" />
                            동의
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{report.objection}</p>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Dialog open={isDialogOpen && selectedReport?.id === report.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            if (!currentUser) {
                              toast({
                                title: "로그인이 필요합니다",
                                description: "이의제기를 작성하려면 로그인이 필요합니다.",
                                variant: "destructive",
                              })
                              return
                            }
                            setSelectedReport(report)
                          }}
                        >
                          <MessageSquareIcon className="h-4 w-4" />
                          이의제기
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>이의제기 작성</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="이의제기 내용을 입력하세요..."
                            value={objection}
                            onChange={(e) => setObjection(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setObjection("");
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              onClick={() => handleObjectionSubmit(report.id)}
                              disabled={!objection.trim()}
                            >
                              제출
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
