import { ReportForm } from "@/components/report-form"
import { ReportList } from "@/components/report-list"
import { Leaderboard } from "@/components/leaderboard"
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-2">다이어트 신고센터</h1>
        <p className="text-gray-600">다이어트 중인 친구가 간식을 먹는 모습을 목격하셨나요? 여기에 신고해주세요!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-600">신고하기</h2>
          
          <ReportForm />

          <Leaderboard />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-600">최근 신고 내역</h2>
          <ReportList />
        </div>
      </div>
    </div>
  )
}
