// pages/api/getCertImgList.ts
import { XMLParser } from 'fast-xml-parser';
import { NextRequest, NextResponse } from 'next/server';

interface FoodInfoParams {
  foodNm: string;
  pageNo?: string;
  numOfRows?: string;
}

async function fetchFoodInfo({ foodNm, pageNo = '1', numOfRows = '20' }: FoodInfoParams) {
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
      method: 'POST',
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const foodNm = searchParams.get('foodNm') || '';
    const pageNo = searchParams.get('pageNo') || '1';
    const numOfRows = searchParams.get('numOfRows') || '20';

    const data = await fetchFoodInfo({
      foodNm,
      pageNo,
      numOfRows
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}