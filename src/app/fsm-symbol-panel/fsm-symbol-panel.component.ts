import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SymbolServerState } from '../trading-state.service';
import { SymbolClientState } from '../fsm-engine.service';

@Component({
  selector: 'app-fsm-symbol-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fsm-symbol-panel.component.html',
})
export class FsmSymbolPanelComponent {
  @Input() symbol = '';
  @Input() serverState!: SymbolServerState;
  @Input() clientState!: SymbolClientState;
}
