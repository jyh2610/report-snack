// 파일: pages/api/getCertImgList.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { XMLParser } from 'fast-xml-parser'

// fetchFoodInfo를 같은 파일이든 lib/food.ts처럼 분리된 모듈이든 import 하세요
import { fetchFoodInfo } from '@/lib/food'  

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 쿼리 파라미터 추출
  const { foodNm = '', pageNo = '1', numOfRows = '20' } = req.query as {
    foodNm?: string
    pageNo?: string
    numOfRows?: string
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const data = await fetchFoodInfo({ foodNm, pageNo, numOfRows })
    return res.status(200).json(data)
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
