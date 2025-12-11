import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TradingStateService, Instr } from '../trading-state.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-non-market-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './non-market-test.component.html',
})
export class NonMarketTestComponent implements OnInit {
  instruments$!: Observable<Instr[]>;

  selectedSymbol: string | null = null;
  fakeSignal: 'BUY' | 'SELL' = 'BUY';
  fakeThreshold?: number;
  fakeLtp?: number;

  constructor(private svc: TradingStateService) {}

  ngOnInit(): void {
    this.instruments$ = this.svc
      .pollState(5000)
      .pipe(map((s) => s.instruments));
  }
onSymbolChange(value: string): void {
  this.selectedSymbol = value;
  console.log('selectedSymbol =', this.selectedSymbol);
}

  sendFakeSignal(): void {
    if (!this.selectedSymbol) return;
    this.svc
      .sendTvSignal({
        symbol: this.selectedSymbol,
        signal: this.fakeSignal,
        buyThreshold: this.fakeThreshold,
      })
      .subscribe({
        next: () => console.log('Fake TV signal sent'),
        error: (e) => console.error('TV signal error', e),
      });
  }

  sendFakeLtp(): void {
    if (!this.selectedSymbol || this.fakeLtp == null) return;
    this.svc
      .sendFakeLtp({ symbol: this.selectedSymbol, ltp: this.fakeLtp })
      .subscribe({
        next: () => console.log('Fake LTP sent'),
        error: (e) => console.error('Fake LTP error', e),
      });
  }
}
