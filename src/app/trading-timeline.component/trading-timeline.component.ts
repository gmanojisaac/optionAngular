import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTreeModule } from '@angular/material/tree';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TradingLogEntry, LogSource } from '../trading-log.model';

interface TimeNode {
  label: string;            // "Hour 09", "09:15"
  hour: number;
  minute: number | null;    // null = hour, number = minute
  children?: TimeNode[];    // minutes for an hour node
}

@Component({
  selector: 'app-trading-timeline',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatTreeModule,
    MatStepperModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './trading-timeline.component.html',
  styleUrls: ['./trading-timeline.component.css'],
})
export class TradingTimelineComponent {
  readonly startMinutes = 9 * 60 + 15;   // 9:15
  readonly endMinutes   = 15 * 60 + 30;  // 15:30

  tradingHours: number[];                     // [9,10,11,12,13,14,15]
  private minutesByHour = new Map<number, TimeNode[]>(); // hour -> minute nodes

  // Tree roots for current hour step (used as [dataSource])
  timeTreeRoots: TimeNode[] = [];

  // Selection
  selectedMinuteNode: TimeNode | null = null;

  // Logs
  allLogs: TradingLogEntry[] = [];
  filteredLogs: TradingLogEntry[] = [];
  displayedColumns = ['time', 'symbol', 'source', 'event', 'details'];

  // Market / Test filter (third section)
  currentSourceFilter: LogSource | 'ALL' = 'ALL';

  constructor() {
    this.tradingHours = this.buildTradingHours();
    this.buildMinutesPerHour();
    this.seedMockLogs();   // replace with real logs later

    // Initialize tree with the first hour so dataSource is valid
    if (this.tradingHours.length) {
      this.onHourSelected(this.tradingHours[0]);
    }
  }

  // ---- Tree helpers ----

  childrenAccessor = (node: TimeNode) => node.children ?? [];

  hasChild = (_: number, node: TimeNode) =>
    !!node.children && node.children.length > 0;

  hourLabel(hour: number): string {
    return `${this.pad2(hour)}:00`;
  }

  pad2(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private buildTradingHours(): number[] {
    const set = new Set<number>();
    for (let m = this.startMinutes; m < this.endMinutes; m++) {
      set.add(Math.floor(m / 60));
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  private buildMinutesPerHour(): void {
    for (let m = this.startMinutes; m < this.endMinutes; m++) {
      const h = Math.floor(m / 60);
      const minute = m % 60;
      const arr = this.minutesByHour.get(h) ?? [];
      arr.push({
        label: `${this.pad2(h)}:${this.pad2(minute)}`,
        hour: h,
        minute,
      });
      this.minutesByHour.set(h, arr);
    }
  }

  onHourSelected(hour: number): void {
    this.selectedMinuteNode = null;
    this.filteredLogs = [];

    const minutes = this.minutesByHour.get(hour) ?? [];
    this.timeTreeRoots = [
      {
        label: `Hour ${this.pad2(hour)}`,
        hour,
        minute: null,
        children: minutes,
      },
    ];
  }

  isSelected(node: TimeNode): boolean {
    return (
      !!this.selectedMinuteNode &&
      node.minute !== null &&
      node.hour === this.selectedMinuteNode.hour &&
      node.minute === this.selectedMinuteNode.minute
    );
  }

  onMinuteClick(node: TimeNode): void {
    if (node.minute == null) return; // ignore hour node
    this.selectedMinuteNode = node;
    this.applyLogFilter();
  }

  // ---- Logs & filtering ----

  setSourceFilter(src: LogSource | 'ALL'): void {
    this.currentSourceFilter = src;
    this.applyLogFilter();
  }

  private applyLogFilter(): void {
    if (!this.selectedMinuteNode) {
      this.filteredLogs = [];
      return;
    }
    const { hour, minute } = this.selectedMinuteNode;
    this.filteredLogs = this.allLogs.filter((log) => {
      const h = log.timestamp.getHours();
      const m = log.timestamp.getMinutes();
      const matchesTime = h === hour && m === minute;
      const matchesSource =
        this.currentSourceFilter === 'ALL' ||
        log.source === this.currentSourceFilter;
      return matchesTime && matchesSource;
    });
  }

  // ---- MOCK data: replace with real FSM/server logs ----

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
