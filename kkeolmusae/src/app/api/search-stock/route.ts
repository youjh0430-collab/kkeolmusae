/**
 * Role: 종목명으로 Yahoo Finance 티커를 검색하는 API
 * Key Features: yahoo-finance2 search → 종목명/심볼 자동 매칭
 * Dependencies: yahoo-finance2
 */

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length < 1) {
    return Response.json({ results: [] })
  }

  try {
    const result = await yf.search(query.trim(), { quotesCount: 8, newsCount: 0 })

    const stocks = (result.quotes || [])
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY'))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange || '',
        type: q.quoteType,
      }))

    return Response.json({ results: stocks })
  } catch (err: any) {
    console.error('종목 검색 오류:', err.message)
    return Response.json({ results: [] })
  }
}
