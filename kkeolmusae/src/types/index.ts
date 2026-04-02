export interface SimulationInput {
  itemName: string
  itemPrice: number       // 원 단위
  periodStart: string     // YYYY-MM-DD
  periodEnd: string       // YYYY-MM-DD
  stockTicker: string     // 예: '005930.KS', 'AAPL'
  stockName: string
  userId?: string         // 로그인 유저 UUID (선택)
  frequency?: number      // 빈도수 (선택)
}

export interface SimulationResult {
  id: string
  user_id: string | null
  item_name: string
  item_price: number
  period_start: string
  period_end: string
  stock_ticker: string
  stock_name: string
  buy_price: number
  current_price: number
  return_rate: number
  investment_amount: number
  profit_amount: number
  share_image_url: string | null
  created_at: string
}

export interface StockHistoryItem {
  date: string    // YYYY-MM-DD
  close: number
}

export interface StockHistoryResponse {
  ticker: string
  history: StockHistoryItem[]
}
