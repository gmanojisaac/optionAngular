import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export type BuyCondn = boolean | null;
export type Signal = 'BUY' | 'SELL' | null;

export interface Instr {
  symbol: string;
  exchange: 'NFO' | 'BFO';
  tradingsymbol: string;
  token: number;
  lot: number;
}

export interface SymbolServerState {
  ltp: number | null;
  buyThreshold: number | null;
  lastBuyThreshold: number | null;
  buyThresholdCondn: BuyCondn;      // true / false / null (null == undefined)
  lastSignal: Signal;               // 'BUY' | 'SELL' | null
  sellSignalsAfterBuy: number;
  reEnterBuyCondition: boolean;
}

export interface ServerStateResponse {
  symbols: string[];
  state: Record<string, SymbolServerState>;
  instruments: Instr[];
}

export type TradeMode = 'paper' | 'livesim' | 'live';
export type TradeAction = 'OPEN' | 'CLOSE';
export type TradeDirection = 'BUY' | 'SELL';

@Injectable({ providedIn: 'root' })
export class TradingStateService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /** Poll server /state every `intervalMs` ms */
  pollState(intervalMs = 1000): Observable<ServerStateResponse> {
    return timer(0, intervalMs).pipe(
      switchMap(() =>
        this.http.get<ServerStateResponse>(`${this.baseUrl}/state`)
      )
    );
  }

  /** Send trade command to server */
  sendTradeCommand(payload: {
    symbol: string;
    mode: TradeMode;
    action: TradeAction;
    direction: TradeDirection;
    qty?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/trade`, payload);
  }

    /** Send a fake TradingView signal to the Node server */
  sendTvSignal(payload: {
    symbol: string;
    signal: 'BUY' | 'SELL';
    buyThreshold?: number;
  }) {
    return this.http.post(`${this.baseUrl}/tv-signal`, payload);
  }

  /** Optional: send fake LTP to server (you add /fake-ltp on Node side) */
  sendFakeLtp(payload: { symbol: string; ltp: number }) {
    return this.http.post(`${this.baseUrl}/fake-ltp`, payload);
  }

  
}


