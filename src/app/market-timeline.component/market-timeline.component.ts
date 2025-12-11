import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TradingLogEntry, LogSource } from '../trading-log.model';

interface TimeRow {
  label: string;           // "Hour 09" or "10:15"
  hour: number;
  minute: number | null;   // null = hour row; number = minute row
}

@Component({
  selector: 'app-market-timeline',
  standalone: true,
  imports: [CommonModule, ScrollingModule, MatTableModule, MatButtonModule],
  templateUrl: './market-timeline.component.html',
  styleUrls: ['./market-timeline.component.css'],
})
export class MarketTimelineComponent {
  readonly startMinutes = 9 * 60 + 15;   // 9:15
  readonly endMinutes   = 15 * 60 + 30;  // 15:30

  tradingHours: number[];                           // [9,10,11,12,13,14,15]
  private minutesByHour = new Map<number, number[]>(); // hour -> [minutes]

  timeRows: TimeRow[] = [];       // current hour's hour+minutes for virtual scroll
  selectedHour: number | null = null;
  selectedMinute: number | null = null;

  // logs
  allLogs: TradingLogEntry[] = [];     // TODO: wire real FSM/server logs here
  filteredLogs: TradingLogEntry[] = [];
  displayedColumns = ['time', 'symbol', 'source', 'event', 'details'];

  // Market vs Test filter
  currentSourceFilter: LogSource | 'ALL' = 'ALL';

  constructor() {
    this.tradingHours = this.buildTradingHours();
    this.buildMinutesByHour();
    this.seedMockLogs(); // remove when wiring real logs

    if (this.tradingHours.length) {
      this.selectHour(this.tradingHours[0]);
    }
  }

  private buildTradingHours(): number[] {
    const set = new Set<number>();
    for (let m = this.startMinutes; m < this.endMinutes; m++) {
      set.add(Math.floor(m / 60));
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  private buildMinutesByHour(): void {
    for (let m = this.startMinutes; m < this.endMinutes; m++) {
      const h = Math.floor(m / 60);
      const minute = m % 60;
      const arr = this.minutesByHour.get(h) ?? [];
      arr.push(minute);
      this.minutesByHour.set(h, arr);
    }
  }

  private pad2(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // called when you click 09, 10, 11,... at the top
  selectHour(hour: number): void {
    this.selectedHour = hour;
    this.selectedMinute = null;
    this.filteredLogs = [];

    const minutes = this.minutesByHour.get(hour) ?? [];
    this.timeRows = [
      { label: `Hour ${this.pad2(hour)}`, hour, minute: null },
      ...minutes.map((min) => ({
        label: `${this.pad2(hour)}:${this.pad2(min)}`,
        hour,
        minute: min,
      })),
    ];
  }

  isMinuteSelected(row: TimeRow): boolean {
    return (
      row.minute !== null &&
      this.selectedHour === row.hour &&
      this.selectedMinute === row.minute
    );
  }

  onTimeRowClick(row: TimeRow): void {
    if (row.minute == null) return; // hour row, ignore
    this.selectedHour = row.hour;
    this.selectedMinute = row.minute;
    this.applyLogFilter();
  }

  setSourceFilter(src: LogSource | 'ALL'): void {
    this.currentSourceFilter = src;
    this.applyLogFilter();
  }

  private applyLogFilter(): void {
    if (this.selectedHour == null || this.selectedMinute == null) {
      this.filteredLogs = [];
      return;
    }
    this.filteredLogs = this.allLogs.filter((log) => {
      const h = log.timestamp.getHours();
      const m = log.timestamp.getMinutes();
      const matchesTime = h === this.selectedHour && m === this.selectedMinute;
      const matchesSource =
        this.currentSourceFilter === 'ALL' ||
        log.source === this.currentSourceFilter;
      return matchesTime && matchesSource;
    });
  }

  // ---- MOCK logs for now ----
  private seedMockLogs(): void {
    const mk = (
      hour: number,
      minute: number,
      second: number,
      symbol: string,
      source: LogSource,
      event: string,
      details?: string
    ): TradingLogEntry => ({
      timestamp: new Date(2025, 0, 1, hour, minute, second),
      symbol,
      source,
      event,
      details,
    });

    this.allLogs.push(
      mk(9, 15, 5, 'NIFTY251216C25900', 'MARKET', 'BUY_SIGNAL', 'From TV'),
      mk(9, 15, 8, 'NIFTY251216C25900', 'MARKET', 'FSM_OPEN_PAPER', ''),
      mk(9, 16, 3, 'NIFTY251216C25900', 'MARKET', 'FSM_OPEN_LIVE', ''),
      mk(10, 0,10, 'BANKNIFTY251230C59200', 'TEST', 'FAKE_BUY', 'Backtest'),
      mk(10, 0,20, 'BANKNIFTY251230C59200', 'TEST', 'FAKE_SELL', 'Backtest'),
      mk(14,30, 1, 'BSX251211C84600',      'MARKET', 'SELL_SIGNAL', '')
    );
  }
}
