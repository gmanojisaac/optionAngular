import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, timer, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TradingStateService,
  ServerStateResponse,
  SymbolServerState,
  Instr,
  TradeMode,
} from './trading-state.service';

export type PositionState = 'FLAT' | 'PAPER_LONG' | 'LIVE_LONG';

export interface SymbolClientState {
  symbol: string;
  positionState: PositionState;
  lastMinute: number;
  entryPrice: number | null;
  realizedPnL: number;
  sessionPnL: number;
  cumulativePnL: number;
}

export interface ViewModel {
  symbols: string[];
  serverState: Record<string, SymbolServerState>;
  clientState: Record<string, SymbolClientState>;
}

@Injectable({ providedIn: 'root' })
export class FsmEngineService {
  private symbols$ = new BehaviorSubject<string[]>([]);
  private serverState$ = new BehaviorSubject<Record<string, SymbolServerState>>({});
  private clientState$ = new BehaviorSubject<Record<string, SymbolClientState>>({});
  private instruments: Record<string, Instr> = {};
  private liveMode: TradeMode = 'livesim';

  // 👇 just declare vm$ here
  vm$: Observable<ViewModel>;

  constructor(private svc: TradingStateService) {
    // 👇 initialize vm$ here, with correct generics
    this.vm$ = combineLatest<
      [string[], Record<string, SymbolServerState>, Record<string, SymbolClientState>]
    >([this.symbols$, this.serverState$, this.clientState$]).pipe(
      map(([symbols, serverState, clientState]) => ({ symbols, serverState, clientState }))
    );

    this.startPolling();
    this.startFsm();
  }



  // ... keep your existing startPolling / startFsm / runFsmTick / sendTrade here ...


  private startPolling(): void {
    this.svc.pollState(1000).subscribe({
      next: (data: ServerStateResponse) => {
        this.symbols$.next(data.symbols);
        this.serverState$.next(data.state);
        const currentClient = { ...this.clientState$.value };
        this.instruments = {};
        for (const instr of data.instruments) this.instruments[instr.symbol] = instr;
        for (const sym of data.symbols) {
          if (!currentClient[sym]) {
            currentClient[sym] = {
              symbol: sym,
              positionState: 'FLAT',
              lastMinute: -1,
              entryPrice: null,
              realizedPnL: 0,
              sessionPnL: 0,
              cumulativePnL: 0,
            };
          }
        }
        this.clientState$.next(currentClient);
      },
      error: (err) => console.error('Error polling /state', err),
    });
  }

  private startFsm(): void {
    timer(0, 1000).subscribe(() => this.runFsmTick());
  }

  private runFsmTick(): void {
    const now = new Date();
    const currentMinute = Math.floor(now.getTime() / 60000);
    const symbols = this.symbols$.value;
    const server = this.serverState$.value;
    const client = { ...this.clientState$.value };

    for (const sym of symbols) {
      const s = server[sym];
      const c = client[sym];
      if (!s || !c) continue;

      const ltp = s.ltp ?? null;
      const unrealized =
        c.positionState !== 'FLAT' && c.entryPrice != null && ltp != null
          ? ltp - c.entryPrice
          : 0;
      const totalPnL = c.realizedPnL + unrealized;
      c.sessionPnL = c.realizedPnL + unrealized;

      const isSellSignal = s.lastSignal === 'SELL';
      const isBuySignal = s.lastSignal === 'BUY';
      const buyCond = s.buyThresholdCondn; // true/false/null
      const reEnter = s.reEnterBuyCondition;

      // SELL signal: close any position, update PnL, tell server to CLOSE
      if (isSellSignal) {
        if (c.positionState !== 'FLAT') {
          if (c.entryPrice != null && ltp != null) {
            const pnl = ltp - c.entryPrice;
            c.realizedPnL += pnl;
            c.cumulativePnL += pnl;
          }
          c.entryPrice = null;
          c.positionState = 'FLAT';
          this.sendTrade(sym, this.liveMode, 'CLOSE', 'SELL');
        }
        continue;
      }

      // First sec of minute + BUY or reEnter condition
      const isNewMinute = c.lastMinute !== currentMinute;
      if (isNewMinute) {
        c.lastMinute = currentMinute;
        if (isBuySignal || reEnter) {
          if (c.positionState === 'FLAT') {
            if (buyCond === null) {
              // undefined: do nothing
            } else if (buyCond === true) {
              if (ltp != null) {
                c.positionState = 'PAPER_LONG';
                c.entryPrice = ltp;
              }
            } else if (buyCond === false) {
              // idle this minute
            }
          }
        }
      }

      // In position: PnL-based triggers
      if (c.positionState === 'PAPER_LONG' || c.positionState === 'LIVE_LONG') {
        if (totalPnL > 0) {
          this.sendTrade(sym, this.liveMode, 'OPEN', 'BUY');
          c.positionState = 'LIVE_LONG';
        } else if (totalPnL < 0) {
          this.sendTrade(sym, this.liveMode, 'CLOSE', 'SELL');
        }
      }
    }

    this.clientState$.next(client);
  }

  private sendTrade(
    symbol: string,
    mode: TradeMode,
    action: 'OPEN' | 'CLOSE',
    direction: 'BUY' | 'SELL'
  ): void {
    const instr = this.instruments[symbol];
    const qty = instr?.lot ?? 1;
    this.svc
      .sendTradeCommand({ symbol, mode, action, direction, qty })
      .subscribe({
        error: (err) => console.error('Trade error', symbol, err),
      });
  }
}
