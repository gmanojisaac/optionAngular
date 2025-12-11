export type LogSource = 'MARKET' | 'TEST';

export interface TradingLogEntry {
  timestamp: Date;     // full timestamp
  symbol: string;      // e.g. NIFTY251216C25900
  source: LogSource;   // 'MARKET' or 'TEST'
  event: string;       // e.g. "BUY_SIGNAL", "FSM_OPEN_LIVE"
  details?: string;    // optional text
}
