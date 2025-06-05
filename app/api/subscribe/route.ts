// pages/api/subscribe.js
import webpush from 'web-push';

// (예시) 메모리에 구독을 저장. 실제 서비스에선 DB를 쓰세요.
let subscriptions: any[] = [];

// VAPID 키 세팅
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
webpush.setVapidDetails(
  'mailto:admin@your-domain.com',
  publicKey,
  privateKey
);

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const subscription = req.body;
      // 이미 같은 endpoint가 저장되어 있는지 확인
      const exists = subscriptions.find((sub) => sub.endpoint === subscription.endpoint);
      if (!exists) {
        subscriptions.push(subscription);
      }
      console.log('현재 구독 수:', subscriptions.length);
      return res.status(201).json({ message: '구독 정보 저장 완료' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: '구독 정보 저장 실패' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

// (참고) 다른 파일이나 API에서 이 배열을 가져갈 수 있게, 
//       실제로는 DB 조회 함수로 분리하는 것을 권장합니다.
export { subscriptions };
