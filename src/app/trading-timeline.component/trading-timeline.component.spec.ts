import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingTimelineComponent } from './trading-timeline.component';

describe('TradingTimelineComponent', () => {
  let component: TradingTimelineComponent;
  let fixture: ComponentFixture<TradingTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingTimelineComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
