import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonMarketTestComponent } from './non-market-test.component';

describe('NonMarketTestComponent', () => {
  let component: NonMarketTestComponent;
  let fixture: ComponentFixture<NonMarketTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonMarketTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonMarketTestComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
