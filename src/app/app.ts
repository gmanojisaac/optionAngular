import { Component } from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MarketTimelineComponent } from './market-timeline.component/market-timeline.component';
import { NonMarketTestComponent } from './non-market-test.component/non-market-test.component';
import {NonMarketTimelineComponent} from './non-market-timeline.component/non-market-timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatStepperModule,
    MarketTimelineComponent,
    NonMarketTimelineComponent,
    NonMarketTestComponent,
  ],
  template: `
    <mat-horizontal-stepper>

      <mat-step label="Market Hours Timeline">
        <app-market-timeline></app-market-timeline>
      </mat-step>

      <mat-step label="Non-Market 24h Timeline">
        <app-non-market-timeline></app-non-market-timeline>
      </mat-step>

      <mat-step label="Fake LTP & Signal Test">
        <app-non-market-test></app-non-market-test>
      </mat-step>

    </mat-horizontal-stepper>
  `,
})
export class App {}
