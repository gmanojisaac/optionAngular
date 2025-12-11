import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TradingStateService,
  ServerStateResponse,
  SymbolServerState,
  Instr,
  TradeMode,
} from '../trading-state.service'
import { Subscription, timer } from 'rxjs';

type PositionState = 'FLAT' | 'PAPER_LONG' | 'LIVE_LONG';

interface SymbolClientState {
  symbol: string;
  positionState: PositionState;
  lastMinute: number;          // minute bucket when last decision made
  entryPrice: number | null;
  realizedPnL: number;         // realized from closed paper trades
  sessionPnL: number;          // current session PnL (realized + unrealized)
  cumulativePnL: number;       // can be used as day PnL
}

@Component({
  selector: 'app-fsm-trader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-bold">FSM Trader</h2>

      <div class="text-xs text-gray-500 mb-2">
        Server: http://localhost:3000/state /trade<br />
        Paper & livesim do NOT hit Zerodha. Only mode="live" does.
      </div>

      <div *ngFor="let sym of symbols" class="border rounded p-3 text-sm">
        <h3 class="font-semibold mb-1">{{ sym }}</h3>

        <ng-container *ngIf="serverState[sym] as s">
          <div class="grid grid-cols-2 gap-1">
            <div>LTP: {{ s.ltp }}</div>
            <div>buyThreshold: {{ s.buyThreshold }}</div>
            <div>lastBuyThreshold: {{ s.lastBuyThreshold }}</div>
            <div>buyThresholdCondn: {{ s.buyThresholdCondn }}</div>
            <div>lastSignal: {{ s.lastSignal }}</div>
            <div>sellSignalsAfterBuy: {{ s.sellSignalsAfterBuy }}</div>
            <div>reEnterBuyCondition: {{ s.reEnterBuyCondition }}</div>
          </div>
        </ng-container>

        <ng-container *ngIf="clientState[sym] as c">
          <hr class="my-2" />
          <div class="grid grid-cols-2 gap-1">
            <div>Position: {{ c.positionState }}</div>
            <div>Entry Price: {{ c.entryPrice }}</div>
            <div>Realized PnL: {{ c.realizedPnL | number: '1.2-2' }}</div>
            <div>Session PnL: {{ c.sessionPnL | number: '1.2-2' }}</div>
            <div>Cumulative PnL: {{ c.cumulativePnL | number: '1.2-2' }}</div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class FsmTraderComponent implements OnInit, OnDestroy {
  symbols: string[] = [];
  serverState: Record<string, SymbolServerState> = {};
  instruments: Record<string, Instr> = {};
  clientState: Record<string, SymbolClientState> = {};

  private pollingSub?: Subscription;
  private fsmTimerSub?: Subscription;

  // choose if server live mode should be 'livesim' or 'live'
  private liveMode: TradeMode = 'livesim';

  constructor(
    private svc: TradingStateService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Poll /state every second
    this.pollingSub = this.svc.pollState(1000).subscribe({
      next: (data: ServerStateResponse) => {
        this.symbols = data.symbols;
        this.serverState = data.state;
        this.instruments = {};
        for (const instr of data.instruments) {
          this.instruments[instr.symbol] = instr;
        }

        // ensure local client state exists
        for (const sym of this.symbols) {
          if (!this.clientState[sym]) {
            this.clientState[sym] = {
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
      },
      error: (err) => {
        console.error('Error polling /state', err);
      },
    });

    // Run FSM tick every second
    this.fsmTimerSub = timer(0, 1000).subscribe(() => {
      this.ngZone.run(() => this.runFsmTick());
    });
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
    this.fsmTimerSub?.unsubscribe();
  }

  private runFsmTick(): void {
    const now = new Date();
    const currentMinute = Math.floor(now.getTime() / 60000);

    for (const sym of this.symbols) {
      const s = this.serverState[sym];
      const c = this.clientState[sym];
      if (!s || !c) continue;

      const ltp = s.ltp ?? null;

      // --- calculate unrealized + total PnL ---
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

      // ===== SELL signal logic (any second) =====
      if (isSellSignal) {
        if (c.positionState !== 'FLAT') {
          // close paper position
          if (c.entryPrice != null && ltp != null) {
            const pnl = ltp - c.entryPrice;
            c.realizedPnL += pnl;
            c.cumulativePnL += pnl;
          }
          c.entryPrice = null;
          c.positionState = 'FLAT';

          // tell server to close any live/livesim
          this.sendTrade(sym, this.liveMode, 'CLOSE', 'SELL');
        }
        // if flat: just ignore for rest of minute (handled by lastMinute)
        continue;
      }

      // ===== First sec / BUY or reEnterBuyCondition in current minute =====
      const isNewMinute = c.lastMinute !== currentMinute;
      if (isNewMinute) {
        c.lastMinute = currentMinute;

        if (isBuySignal || reEnter) {
          if (c.positionState === 'FLAT') {
            if (buyCond === null) {
              // undefined: do nothing
            } else if (buyCond === true) {
              // start paper simulation
              if (ltp != null) {
                c.positionState = 'PAPER_LONG';
                c.entryPrice = ltp;
              }
            } else if (buyCond === false) {
              // buy condition false -> idle this minute
            }
          }
        }
      }

      // ===== In position: PnL-based live/livesim control =====
      if (c.positionState === 'PAPER_LONG' || c.positionState === 'LIVE_LONG') {
        if (totalPnL > 0) {
          // profitable → tell server to initiate livesim/live
          this.sendTrade(sym, this.liveMode, 'OPEN', 'BUY');
          // optional: mark that we have live exposure now
          c.positionState = 'LIVE_LONG';
        } else if (totalPnL < 0) {
          // losing → tell server to close livesim/live
          this.sendTrade(sym, this.liveMode, 'CLOSE', 'SELL');
          // but keep paper position open or not? your choice; here we keep
        }
      }
    }
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
        next: () => {
          // console.log('Trade sent', symbol, mode, action, direction);
        },
        error: (err) => {
          console.error('Trade error', symbol, err);
        },
      });
  }
}
