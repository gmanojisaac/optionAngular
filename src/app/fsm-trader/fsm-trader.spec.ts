import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FsmTrader } from './fsm-trader';

describe('FsmTrader', () => {
  let component: FsmTrader;
  let fixture: ComponentFixture<FsmTrader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FsmTrader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FsmTrader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
