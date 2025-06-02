"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, User } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import Pusher from 'pusher-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Message {
  id: string
  content: string
  sender: string
  nickname: string
  timestamp: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [nickname, setNickname] = useState("")
  const [showNicknameDialog, setShowNicknameDialog] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = useRef(uuidv4())
  const pusherRef = useRef<Pusher | null>(null)

  useEffect(() => {
    const savedNickname = localStorage.getItem('chatNickname')
    if (savedNickname) {
      setNickname(savedNickname)
      setShowNicknameDialog(false)
    }
  }, [])

  useEffect(() => {
    if (!nickname) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
    })

    const channel = pusher.subscribe('chat')
    
    channel.bind('message', (data: Message) => {
      setMessages(prev => [...prev, data])
    })

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true)
    })

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false)
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
    if (!message.trim()) return

    const newMessage: Message = {
      id: uuidv4(),
      content: message,
      sender: userId.current,
      nickname: nickname,
      timestamp: Date.now()
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      })

      if (!response.ok) throw new Error('메시지 전송 실패')
      
      setMessage("")
    } catch (error) {
      console.error('메시지 전송 중 오류:', error)
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
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? '연결됨' : '연결 끊김'}
              </span>
            </div>
          </div>

          <div className="h-[600px] overflow-y-auto mb-4 space-y-4 p-4 bg-muted/50 rounded-lg">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === userId.current ? 'justify-end' : 'justify-start'}`}
              >
                <div
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
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button type="submit" disabled={!isConnected}>
              <Send className="h-4 w-4 mr-2" />
              전송
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
