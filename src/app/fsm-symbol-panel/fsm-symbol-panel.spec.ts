import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FsmSymbolPanel } from './fsm-symbol-panel';

describe('FsmSymbolPanel', () => {
  let component: FsmSymbolPanel;
  let fixture: ComponentFixture<FsmSymbolPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FsmSymbolPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FsmSymbolPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
