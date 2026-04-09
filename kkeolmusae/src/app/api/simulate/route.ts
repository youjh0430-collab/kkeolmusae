import YahooFinance from 'yahoo-finance2'
import { supabaseAdmin } from '@/lib/supabase'
import type { SimulationInput } from '@/types/index'

// yahoo-finance2 v3: 인스턴스 생성 필수
const yf = new YahooFinance()

interface Quote {
  date: Date
  close: number | null
  open: number | null
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

    // yahoo-finance2 v3: historical() 메서드 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: any[] = await yf.historical(stockTicker, {
      period1: new Date(periodStart),
      period2: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // 종료일 포함
      interval: '1d',
    })

    if (!quotes || quotes.length < 2) {
      return Response.json({ 
        error: `해당 기간의 주가 데이터가 부족합니다. (${quotes?.length || 0}개 데이터 찾음)` 
      }, { status: 422 })
    }

    const buyPrice = quotes[0].close as number
    const currentPrice = quotes[quotes.length - 1].close as number
    
    // 통화 정보
    const currency: string = stockTicker.endsWith('.KS') || stockTicker.endsWith('.KQ') ? 'KRW' : 'USD'

    const returnRate = ((currentPrice - buyPrice) / buyPrice) * 100
    // 빈도수(frequency)가 넘어오면 횟수 기반으로, 없으면 단순 기간(days) 기반으로 계산
    const times = frequency && typeof frequency === 'number' && frequency > 0 ? Number(frequency) : days;
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
