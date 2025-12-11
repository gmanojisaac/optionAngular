import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, map } from 'rxjs';

import { FsmEngineService, ViewModel } from '../fsm-engine.service';
import { TradingStateService, Instr } from '../trading-state.service';
import { FsmSymbolPanelComponent } from '../fsm-symbol-panel/fsm-symbol-panel.component'

interface SecondRow {
  index: number;
  timeLabel: string;
}

@Component({
  selector: 'app-fsm-test-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    ScrollingModule,
    FsmSymbolPanelComponent,
  ],
  templateUrl: './fsm-test-shell.component.html',
  styleUrls: ['./fsm-test-shell.component.css'],
})
export class FsmTestShellComponent {
  // 👇 this is what the template is using
  vm$: Observable<ViewModel>;
  instruments$: Observable<Instr[]>;

  displayedColumns = ['symbol', 'exchange', 'tradingsymbol', 'token', 'lot'];

  selectedSymbol: string | null = null;
  fakeSignal: 'BUY' | 'SELL' = 'BUY';
  fakeThreshold?: number;
  fakeLtp?: number;

  seconds: SecondRow[] = this.buildTradingSeconds();

  constructor(
    private engine: FsmEngineService,
    private svc: TradingStateService
  ) {
    this.vm$ = this.engine.vm$;
    this.instruments$ = this.svc.pollState(5000).pipe(map((s) => s.instruments));
  }

  private buildTradingSeconds(): SecondRow[] {
    const seconds: SecondRow[] = [];
    const startMinutes = 9 * 60 + 15;  // 9:15
    const endMinutes = 15 * 60 + 30;   // 15:30
    let idx = 0;

    for (let m = startMinutes; m < endMinutes; m++) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      for (let s = 0; s < 60; s++) {
        const h = hours.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        const ss = s.toString().padStart(2, '0');
        seconds.push({ index: idx++, timeLabel: `${h}:${mm}:${ss}` });
      }
    }
    return seconds;
  }

  sendFakeSignal() {
    if (!this.selectedSymbol) return;
    this.svc
      .sendTvSignal({
        symbol: this.selectedSymbol,
        signal: this.fakeSignal,
        buyThreshold: this.fakeThreshold,
      })
      .subscribe({
        next: () => console.log('Fake TV signal sent'),
        error: (err) => console.error('TV signal error', err),
      });
  }

  sendFakeLtp() {
    if (!this.selectedSymbol || this.fakeLtp == null) return;
    this.svc
      .sendFakeLtp({ symbol: this.selectedSymbol, ltp: this.fakeLtp })
      .subscribe({
        next: () => console.log('Fake LTP sent'),
        error: (err) => console.error('Fake LTP error', err),
      });
  }
}
