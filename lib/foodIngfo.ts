// pages/api/getCertImgList.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { XMLParser } from 'fast-xml-parser';

interface FoodInfoParams {
  foodNm: string;
  pageNo?: string;
  numOfRows?: string;
}

export async function fetchFoodInfo({ foodNm, pageNo = '1', numOfRows = '20' }: FoodInfoParams) {
  const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('Service key is not configured');
  }
  if (!foodNm.trim()) {
    throw new Error('foodNm parameter is required');
  }

  const params = new URLSearchParams({
    ServiceKey: serviceKey,
    prdlstNm: foodNm,
    pageNo,
    numOfRows
  });

  const apiUrl = `https://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const result = parser.parse(xmlText);
    return result.response;
  } catch (err: any) {
    console.error('Error fetching public API:', err);
    throw err;
  }
}

// Next.js API 라우트 핸들러
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { foodNm, pageNo, numOfRows } = req.query;
    const data = await fetchFoodInfo({
      foodNm: foodNm as string,
      pageNo: pageNo as string,
      numOfRows: numOfRows as string
    });
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
