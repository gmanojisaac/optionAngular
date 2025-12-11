import { Component } from '@angular/core';
import { FsmTraderComponent } from './fsm-trader/fsm-trader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FsmTraderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}

