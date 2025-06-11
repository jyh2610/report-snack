import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Coffee, Cookie, Calendar } from "lucide-react";

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
    text: "치팅데이 : 간식오는날 한번, 다같이 합의한 날 한번 허용",
  },
];

const Page = () => {
  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Card className="shadow-lg border-green-400">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-green-700 text-center mb-2">
            NO간식 챌린지 <span className="text-base text-gray-500">(내기)</span>
          </CardTitle>
          <p className="text-center text-gray-500">아래의 룰을 꼭 지켜주세요!</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6 mt-4">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border">
                {rule.icon}
                <span className="text-lg font-medium">
                  {rule.text.split(/(X|O|가능|금지|허용|예외)/).map((part, i) =>
                    ["X", "O", "가능", "금지", "허용", "예외"].includes(part) ? (
                      <span key={i} className="font-bold text-green-600">{part}</span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;
