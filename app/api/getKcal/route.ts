import { NextRequest, NextResponse } from 'next/server';

let tokenCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FATSECRET_CLIENT_ID or CLIENT_SECRET is not configured');
  }

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
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
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
    expires_at: Date.now() + expiresIn * 1000 - 60 * 1000,
  };

  return data.access_token;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const foodNm = searchParams.get('foodNm');
  const page = searchParams.get('page') || '1';
  const max_results = searchParams.get('max_results') || '20';

  if (!foodNm) {
    return NextResponse.json({ error: 'foodNm 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
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
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch food data: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
