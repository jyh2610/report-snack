"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CakeIcon, ClockIcon, MapPinIcon, MessageSquareIcon, UserIcon } from "lucide-react"
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

export interface Report {
  name: string;
  snack_kind: string;
  location: string;
  date: string;
  description: string;
  id: string;
  objection?: string;
  informant: string;
}

export function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [objection, setObjection] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    try {
      const { error } = await supabase
        .from('report')
        .update({ objection })
        .eq('id', reportId);

      if (error) throw error;

      setObjection("");
      setIsDialogOpen(false);
      fetchReports(); // 목록 새로고침
    } catch (error) {
      console.error('Error submitting objection:', error);
    }
  };

  useEffect(() => {
    fetchReports()

    // 실시간 구독 설정
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
          // 데이터 변경 시 전체 목록 다시 로드
          fetchReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
                      <p className="text-sm font-medium text-gray-700 mb-1">이의제기</p>
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
                          onClick={() => setSelectedReport(report)}
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
