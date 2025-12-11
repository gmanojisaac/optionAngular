import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TradingLogEntry, LogSource } from '../trading-log.model';

interface TimeRow {
  label: string;          // "Hour 00", "00:15", etc.
  hour: number;
  minute: number | null;  // null = hour row
}

@Component({
  selector: 'app-non-market-timeline',
  standalone: true,
  imports: [CommonModule, ScrollingModule, MatTableModule, MatButtonModule],
  templateUrl: './non-market-timeline.component.html',
  styleUrls: ['./non-market-timeline.component.css'],
})
export class NonMarketTimelineComponent {
  hours24: number[] = Array.from({ length: 24 }, (_, i) => i);

  timeRows: TimeRow[] = [];       // dynamic for the selected hour
  selectedHour: number | null = null;
  selectedMinute: number | null = null;

  // Logs (from server + fake test events)
  allLogs: TradingLogEntry[] = [];
  filteredLogs: TradingLogEntry[] = [];
  displayedColumns = ['time', 'symbol', 'source', 'event', 'details'];

  currentSourceFilter: LogSource | 'ALL' = 'ALL';

  constructor() {
    this.seedMockLogs(); // Remove after wiring server logs
    this.selectHour(0);  // Default to hour 00
  }

  private pad2(n: number): string {
    return n.toString().padStart(2, '0');
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
    this.selectedMinute = null;
    this.filteredLogs = [];

    this.timeRows = [
      { label: `Hour ${this.pad2(hour)}`, hour, minute: null },
      ...Array.from({ length: 60 }, (_, m) => ({
        label: `${this.pad2(hour)}:${this.pad2(m)}`,
        hour,
        minute: m,
      })),
    ];
  }

  isMinuteSelected(row: TimeRow): boolean {
    return (
      row.minute !== null &&
      row.hour === this.selectedHour &&
      row.minute === this.selectedMinute
    );
  }

  onTimeRowClick(row: TimeRow): void {
    if (row.minute == null) return;
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

  // Mock logs (replace with FSM/server logs)
  private seedMockLogs(): void {
    const mk = (
      hour: number,
      minute: number,
      second: number,
      symbol: string,
      source: LogSource,
      event: string,
      details?: string
    ) => ({
      timestamp: new Date(2025, 0, 1, hour, minute, second),
      symbol,
      source,
      event,
      details,
    });

    this.allLogs.push(
      mk(0, 5, 10,  'TEST1', 'TEST', 'FAKE_LTP', 'LTP=123'),
      mk(2, 10, 2,  'TEST2', 'TEST', 'FAKE_BUY', 'Test BUY'),
      mk(12, 0, 30, 'TEST3', 'TEST', 'FAKE_SELL', 'Test SELL'),
      mk(23, 59, 58,'TEST4', 'TEST', 'FAKE_SIGNAL', 'EOD testing')
    );
  }
}
