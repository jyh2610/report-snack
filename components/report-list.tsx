"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CakeIcon, ClockIcon, MapPinIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"



export interface Report {
  name: string;
  snack_kind: string;
  location: string;
  date: string;
  description: string;
  id: string;
}

export function ReportList() {
  const [reports ,setReports] = useState<Report[]>([])

  const fetchReports = async () => {
    const  { data: report, error } = await supabase
      .from('report')
      .select('*')
    if (error) {
      console.error('Error fetching reports:', error)
    }
    setReports(report || [])
  }
  

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">아직 신고 내역이 없습니다.</CardContent>
        </Card>
      ) : (
        reports.map((report , index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 bg-green-100 text-green-600">
                  <AvatarFallback>{report.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium">{report.name}</h3>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
