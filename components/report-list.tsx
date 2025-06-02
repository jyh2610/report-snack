"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CakeIcon,
  ClockIcon,
  MapPinIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  UserIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

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
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useUser();

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [objection, setObjection] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  // 알림 권한 상태 ("default" | "granted" | "denied")
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // 컴포넌트가 마운트된 후 실행
  useEffect(() => {
    setMounted(true);

    // 1) 브라우저 Notification API 권한 요청
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // 브라우저 알림 띄우기 헬퍼
  const showBrowserNotification = (
    title: string,
    options?: NotificationOptions
  ) => {
    if (notificationPermission === "granted") {
      new Notification(title, options);
    }
  };

  // Supabase로부터 사용자 목록(fetchUsers) 불러오기
  const fetchUsers = async () => {
    const { data: users, error } = await supabase.from("user").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(users || []);
  };

  // Supabase로부터 리포트 목록(fetchReports) 불러오기
  const fetchReports = async () => {
    const { data: report, error } = await supabase.from("report").select("*");
    if (error) {
      console.error("Error fetching reports:", error);
    }
    setReports(report || []);
  };

  // 이의제기 제출 핸들러
  const handleObjectionSubmit = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "이의제기를 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      setIsDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("report")
        .update({
          objection,
          informant: currentUser.username, // 이의제기 작성자 추가
        })
        .eq("id", reportId);

      if (error) throw error;

      setObjection("");
      setIsDialogOpen(false);
      await fetchReports();

      toast({
        title: "이의제기 제출 완료",
        description: "이의제기가 성공적으로 제출되었습니다.",
      });
    } catch (error) {
      console.error("Error submitting objection:", error);
      toast({
        title: "이의제기 제출 실패",
        description: "이의제기를 제출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 이의제기에 동의(agreed) 핸들러
  const handleAgree = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "이의제기에 동의하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return;

      const currentAgreements = report.agreements || {};
      if (currentAgreements[currentUser.id]) {
        toast({
          title: "이미 동의하셨습니다",
          description: "이 이의제기에 이미 동의하셨습니다.",
        });
        return;
      }

      const newAgreements = {
        ...currentAgreements,
        [currentUser.id]: true,
      };

      const agreedCount = Object.keys(newAgreements).length;
      if (agreedCount === users.length) {
        // 모든 사용자가 동의했으면 해당 리포트를 삭제
        const { error: deleteError } = await supabase
          .from("report")
          .delete()
          .eq("id", reportId);

        if (deleteError) throw deleteError;

        toast({
          title: "신고가 삭제되었습니다",
          description: "모든 사용자의 동의로 신고가 삭제되었습니다.",
        });
      } else {
        // 동의 수만 업데이트
        const { error: updateError } = await supabase
          .from("report")
          .update({ agreements: newAgreements })
          .eq("id", reportId);

        if (updateError) throw updateError;

        toast({
          title: "동의 완료",
          description: "이의제기에 동의하셨습니다.",
        });
      }

      await fetchReports();
    } catch (error) {
      console.error("Error agreeing to objection:", error);
      toast({
        title: "동의 실패",
        description: "이의제기에 동의하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // mounted가 true일 때만 Supabase 리얼타임 리스너 구독
  useEffect(() => {
    if (!mounted) return;

    fetchUsers();
    fetchReports();

    const channel = supabase
      .channel("reports_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "report",
        },
        async (payload) => {
          // DB 변경 감지 시 리포트 목록 새로고침
          await fetchReports();

          // payload.eventType 은 "INSERT" | "UPDATE" | "DELETE"
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          let title = "";
          let body = "";
          const icon = "/notification-icon.png"; // 원하는 아이콘 경로 (public 폴더에 위치)

          if (eventType === "INSERT") {
            title = "새 신고가 등록되었습니다";
            body = `${newRecord.name}님이 ${newRecord.snack_kind} 신고를 등록하였습니다.`;
          } else if (eventType === "UPDATE") {
            // 이의제기가 새로 달렸을 때
            if (
              oldRecord.objection !== newRecord.objection &&
              newRecord.objection
            ) {
              title = "신고에 이의제기가 달렸습니다";
              body = `${newRecord.informant}님이 이의제기를 작성했습니다.`;
            } else {
              // 그 외 업데이트 (예: 동의 수 증가)
              title = "신고 정보가 업데이트되었습니다";
              body = `${newRecord.name}님의 신고 정보가 변경되었습니다.`;
            }
          } else if (eventType === "DELETE") {
            title = "신고가 삭제되었습니다";
            body = `${oldRecord.name}님의 신고가 삭제되었습니다.`;
          }

          if (title) {
            showBrowserNotification(title, { body, icon });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, notificationPermission]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            아직 신고 내역이 없습니다.
          </CardContent>
        </Card>
      ) : (
        reports.map((report, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 bg-green-100 text-green-600">
                  <AvatarFallback>
                    {report.name.charAt(0)}
                  </AvatarFallback>
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

                  {report.description && (
                    <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                      {report.description}
                    </p>
                  )}

                  {report.objection && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            이의제기
                          </p>
                          <p className="text-xs text-gray-500">
                            작성자: {report.informant}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {Object.keys(report.agreements || {}).length}/
                            {users.length}명 동의
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleAgree(report.id)}
                            disabled={
                              !currentUser ||
                              (report.agreements || {})[currentUser.id]
                            }
                          >
                            <ThumbsUpIcon className="h-4 w-4" />
                            동의
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {report.objection}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Dialog
                      open={isDialogOpen && selectedReport?.id === report.id}
                      onOpenChange={setIsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            if (!currentUser) {
                              toast({
                                title: "로그인이 필요합니다",
                                description:
                                  "이의제기를 작성하려면 로그인이 필요합니다.",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSelectedReport(report);
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
                              onClick={() =>
                                handleObjectionSubmit(report.id)
                              }
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
  );
}
