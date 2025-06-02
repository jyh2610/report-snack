"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"

interface NavItem {
  title: string
  href: string
}

const items: NavItem[] = [
  {
    title: "홈",
    href: "/",
  },
  {
    title: "룰북",
    href: "/rulebook",
  },
  {
    title: "신고하기",
    href: "/report",
  },
  {
    title: "리더보드",
    href: "/leaderboard",
  },
  {
    title: "간식 도감",
    href: "/snackbook",
  },
]

export function Nav() {
  const pathname = usePathname()
  const { toast } = useToast()
  const router = useRouter()
  const { currentUser, setCurrentUser } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    setCurrentUser(null)
    toast({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다.",
    })
    router.push('/login')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-black dark:text-white"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.id}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>로그인</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 