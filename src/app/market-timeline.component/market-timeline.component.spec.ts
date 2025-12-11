import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketTimelineComponent } from './market-timeline.component';

describe('MarketTimelineComponent', () => {
  let component: MarketTimelineComponent;
  let fixture: ComponentFixture<MarketTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketTimelineComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
