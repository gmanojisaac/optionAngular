import{Component}from'@angular/core';
import{CommonModule}from'@angular/common';
import{Observable}from'rxjs';
import{FsmEngineService,ViewModel}from'../fsm-engine.service';
import{FsmSymbolPanelComponent}from'../fsm-symbol-panel/fsm-symbol-panel.component';
@Component({selector:'app-fsm-trader',standalone:true,
imports:[CommonModule,FsmSymbolPanelComponent],
templateUrl:'./fsm-trader.component.html'})
export class FsmTraderComponent{
vm$:Observable<ViewModel>;
constructor(engine:FsmEngineService){this.vm$=engine.vm$;}}
