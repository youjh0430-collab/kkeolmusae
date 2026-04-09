/**
 * Role: 시뮬레이션 API — 주가 데이터 조회 및 수익률 계산
 * Key Features: yahoo-finance2 chart() API, Supabase 저장, retry 로직
 * Dependencies: yahoo-finance2, @supabase/supabase-js
 */
import YahooFinance from 'yahoo-finance2'
import { supabaseAdmin } from '@/lib/supabase'
import type { SimulationInput } from '@/types/index'

// yahoo-finance2 v3: 매 요청마다 새 인스턴스 사용하여 서버리스 환경 호환
async function fetchStockData(ticker: string, periodStart: string, periodEnd: string) {
  const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] })

  // 종료일 포함을 위해 +1일
  const endDate = new Date(periodEnd)
  endDate.setDate(endDate.getDate() + 1)

  // chart() 메서드 사용 — historical()은 deprecated
  const result = await yf.chart(ticker, {
    period1: periodStart,
    period2: endDate.toISOString().split('T')[0],
    interval: '1d',
  })

  const quotes = (result.quotes || []).filter(
    (q: any) => q.close != null && q.open != null
  )

  return { quotes, currency: result.meta?.currency || 'USD' }
}

// retry 로직 — 서버리스 환경에서 간헐적 실패 대응
async function fetchWithRetry(ticker: string, periodStart: string, periodEnd: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchStockData(ticker, periodStart, periodEnd)
    } catch (err: any) {
      console.error(`주가 조회 시도 ${i + 1}/${retries + 1} 실패 (${ticker}):`, err.message)
      if (i === retries) throw err
      // 재시도 전 짧은 대기
      await new Promise(r => setTimeout(r, 500 * (i + 1)))
    }
  }
  throw new Error('주가 데이터 조회 실패')
}

export async function POST(request: Request) {
  let body: SimulationInput
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { itemName, itemPrice, periodStart, periodEnd, stockTicker, stockName, userId, frequency } = body

  if (!itemName || !itemPrice || !periodStart || !periodEnd || !stockTicker || !stockName) {
    return Response.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
  }

  try {
    // 기간 내 일수 계산
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

    // 주가 데이터 조회 (retry 포함)
    const { quotes, currency: detectedCurrency } = await fetchWithRetry(stockTicker, periodStart, periodEnd)

    if (quotes.length < 2) {
      return Response.json({
        error: `해당 기간의 주가 데이터가 부족합니다. (${quotes.length}개 데이터 찾음)`
      }, { status: 422 })
    }

    const buyPrice = quotes[0].close as number
    const currentPrice = quotes[quotes.length - 1].close as number
    const currency = detectedCurrency || (stockTicker.endsWith('.KS') || stockTicker.endsWith('.KQ') ? 'KRW' : 'USD')

    const returnRate = ((currentPrice - buyPrice) / buyPrice) * 100
    const times = frequency && typeof frequency === 'number' && frequency > 0 ? Number(frequency) : days
    const investmentAmount = itemPrice * times
    const profitAmount = investmentAmount * (returnRate / 100)

    // 차트용 히스토리 (최대 60개 포인트로 샘플링)
    const step = Math.max(1, Math.floor(quotes.length / 60))
    const history = quotes
      .filter((_: any, i: number) => i % step === 0 || i === quotes.length - 1)
      .map((q: any) => ({
        date: new Date(q.date).toISOString().split('T')[0],
        close: q.close as number,
      }))

    // Supabase에 저장
    const { data: saved, error: dbError } = await supabaseAdmin
      .from('simulations')
      .insert({
        user_id: userId ?? null,
        item_name: itemName,
        item_price: itemPrice,
        period_start: periodStart,
        period_end: periodEnd,
        stock_ticker: stockTicker,
        stock_name: stockName,
        buy_price: buyPrice,
        current_price: currentPrice,
        return_rate: Math.round(returnRate * 100) / 100,
        investment_amount: investmentAmount,
        profit_amount: Math.round(profitAmount),
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB 저장 오류:', dbError)
      return Response.json({ error: 'DB 저장에 실패했습니다.' }, { status: 500 })
    }

    return Response.json({
      id: saved.id,
      itemName,
      itemPrice,
      periodStart,
      periodEnd,
      stockTicker,
      stockName,
      buyPrice,
      currentPrice,
      currency,
      returnRate: Math.round(returnRate * 100) / 100,
      investmentAmount,
      profitAmount: Math.round(profitAmount),
      history,
    })
  } catch (err: any) {
    console.error('시뮬레이션 오류:', err)
    return Response.json({
      error: '주가 데이터를 가져오지 못했습니다. 티커를 확인해주세요. 세부 오류: ' + (err.message || String(err))
    }, { status: 500 })
  }
}
