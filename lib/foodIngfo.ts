// pages/api/getFatsecretFood.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface FoodInfoParams {
  foodNm: string;
  page?: number;
  max_results?: number;
}

let tokenCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_FATSECRET_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FATSECRET_CLIENT_ID or CLIENT_SECRET is not configured');
  }

  // 이미 캐시된 토큰이 있고 아직 유효하다면 재사용
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  const tokenUrl = 'https://oauth.fatsecret.com/connect/token';
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'basic',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get token: ${error}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 86400;

  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + expiresIn * 1000 - 60 * 1000, // 1분 여유
  };

  return data.access_token;
}

export async function fetchFatsecretFoodInfo({
  foodNm,
  page = 1,
  max_results = 20,
}: FoodInfoParams) {
  if (!foodNm.trim()) {
    throw new Error('foodNm parameter is required');
  }

  const token = await getAccessToken();

  const apiUrl = 'https://platform.fatsecret.com/rest/server.api';
  const params = new URLSearchParams({
    method: 'foods.search',
    search_expression: foodNm,
    format: 'json',
    page_number: String(page),
    max_results: String(max_results),
  });

  const response = await fetch(`${apiUrl}?${params}`, {
    method: 'POST', // 문서에 맞게 POST
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch food data: ${error}`);
  }

  return await response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { foodNm, page, max_results } = req.query;
    const data = await fetchFatsecretFoodInfo({
      foodNm: foodNm as string,
      page: page ? parseInt(page as string, 10) : 1,
      max_results: max_results ? parseInt(max_results as string, 10) : 20,
    });
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
