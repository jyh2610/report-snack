"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, User, Users, Loader2, CheckCircle, XCircle, Coffee, Cookie, Calendar } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import Pusher from 'pusher-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from '@/hooks/use-toast'

interface Message {
  id: string
  content: string
  sender: string
  nickname: string
  timestamp: number
}

interface User {
  id: string
  nickname: string
}

const rules = [
  {
    icon: <XCircle className="text-red-500 w-6 h-6" />,
    text: "과일, 과자, 사탕, 초콜렛 등등 X",
  },
  {
    icon: <CheckCircle className="text-green-500 w-6 h-6" />,
    text: "견과류, 채소, 계란 가능",
  },
  {
    icon: <Coffee className="text-brown-500 w-6 h-6" />,
    text: "커피 : 아메리카노&라떼만 O, 그 외 시럽들어간 음료 X",
  },
  {
    icon: <XCircle className="text-red-500 w-6 h-6" />,
    text: "정제탄수화물 금지",
  },
  {
    icon: <Calendar className="text-blue-500 w-6 h-6" />,
    text: "치팅데이: 간식오는날 한번, 다같이 합의한 날 한번 허용",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [nickname, setNickname] = useState("")
  const [showNicknameDialog, setShowNicknameDialog] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = useRef<string | null>(null)
  const pusherRef = useRef<Pusher | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let savedId = localStorage.getItem('chatUserId')
    if (!savedId) {
      savedId = uuidv4()
      localStorage.setItem('chatUserId', savedId)
    }
    userId.current = savedId
  }, [])

  useEffect(() => {
    const savedNickname = localStorage.getItem('chatNickname')
    if (savedNickname) {
      setNickname(savedNickname)
      setShowNicknameDialog(false)
    }
  }, [])

  useEffect(() => {
    if (!nickname) return

    // 환경 변수 확인
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.error('Pusher 환경 변수가 설정되지 않았습니다.')
      return
    }

    console.log('Pusher 설정:', { key: pusherKey, cluster: pusherCluster })

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${window.location.origin}/api/pusher/auth`,
      auth: {
        params: {
          user_id: userId.current,
          user_info: JSON.stringify({ nickname })
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      },
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_streaming', 'xhr_polling'],
      forceTLS: true
    })

    // 연결 상태 모니터링
    pusher.connection.bind('connecting', () => {
      console.log('Pusher 연결 중...')
    })

    pusher.connection.bind('connected', () => {
      console.log('Pusher 연결됨')
      setIsConnected(true)
    })

    pusher.connection.bind('disconnected', () => {
      console.log('Pusher 연결 끊김')
      setIsConnected(false)
    })

    pusher.connection.bind('error', (err: any) => {
      console.error('Pusher 연결 상세 오류:', err)
      setIsConnected(false)
      
      // 연결 재시도
      setTimeout(() => {
        console.log('Pusher 연결 재시도...')
        pusher.connect()
      }, 3000)
    })

    pusher.connection.bind('state_change', (states: any) => {
      console.log('Pusher 상태 변경:', states)
    })

    const channel = pusher.subscribe('presence-chat')
    
    fetchChatHistory()
    
    channel.bind('message', (data: Message) => {
      setMessages(prev => [...prev, data])
    })

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      console.log('채널 구독 성공:', members)
      const users: User[] = []
      
      members.each((member: any) => {
        users.push({
          id: member.id,
          nickname: member.info.nickname || '알 수 없음'
        })
      })
      setOnlineUsers(users)
    })

    channel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => [
        ...prev,
        {
          id: member.id,
          nickname: member.info.nickname || '알 수 없음'
        }
      ])
    })

    channel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== member.id))
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('채널 구독 오류:', error)
    })

    pusherRef.current = pusher

    return () => {
      pusher.disconnect()
    }
  }, [nickname])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname.trim()) {
      localStorage.setItem('chatNickname', nickname)
      setShowNicknameDialog(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    setIsSending(true)
    const newMessage: Message = {
      id: uuidv4(),
      content: message.trim(),
      sender: userId.current ?? "",
      nickname: nickname,
      timestamp: Date.now()
    }

    try {
      console.log('전송할 메시지:', newMessage)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('서버 응답 오류:', errorData)
        throw new Error(errorData.details || '메시지 전송 실패')
      }
      
      setMessage("")
    } catch (error: any) {
      console.error('메시지 전송 중 오류:', error)
                toast({
        title: "메시지 전송 실패",
        description: error.message || "메시지를 전송하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const fetchChatHistory = async (limit?: number) => {
    try {
      const url = limit ? `/api/chat?limit=${limit}` : '/api/chat'
      const response = await fetch(url)
      if (!response.ok) throw new Error('채팅 로그를 불러오지 못했습니다.')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('채팅 로그 조회 중 오류:', error)
    }
  }

  return (
    <>
      <Dialog open={showNicknameDialog} onOpenChange={setShowNicknameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>닉네임 설정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNicknameSubmit}>
            <div className="py-4">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={10}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!nickname.trim()}>
                시작하기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">익명 채팅방</h1>
              <span className="text-sm text-muted-foreground">
                ({nickname})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNicknameDialog(true)}
                className="ml-2"
              >
                닉네임 변경
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchChatHistory(1000)}
              >
                전체 로그 보기
              </Button>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {onlineUsers.length}명 접속 중
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? '연결됨' : '연결 끊김'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="h-[600px] overflow-y-auto mb-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.sender === userId.current ? 'justify-end' : 'justify-start'}`}
                    >
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === userId.current
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {msg.nickname}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp
                            ? new Date(Number(msg.timestamp)).toLocaleTimeString()
                            : ''}
                        </p>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  disabled={!isConnected || isSending}
                  className="min-w-[100px]"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      전송
                    </>
                  )}
                </Button>
              </form>
            </div>

            <Card className="w-64 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                접속자 목록
              </h3>
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
                  >
                    <User className="h-3 w-3" />
                    <span>{user.nickname}</span>
                    {user.id === userId.current && (
                      <span className="text-xs text-muted-foreground">(나)</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </>
  )
}
