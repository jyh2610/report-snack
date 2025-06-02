"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import Pusher from 'pusher-js'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = useRef(uuidv4())
  const pusherRef = useRef<Pusher | null>(null)

  useEffect(() => {
    // Pusher 클라이언트 초기화
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
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage: Message = {
      id: uuidv4(),
      content: message,
      sender: userId.current,
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
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">익명 채팅방</h1>
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
  )
}
