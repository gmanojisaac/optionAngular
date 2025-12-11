import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonMarketTimelineComponent } from './non-market-timeline.component';

describe('NonMarketTimelineComponent', () => {
  let component: NonMarketTimelineComponent;
  let fixture: ComponentFixture<NonMarketTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonMarketTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonMarketTimelineComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
