import { TestBed } from '@angular/core/testing';

import { TradingState } from './trading-state';

describe('TradingState', () => {
  let service: TradingState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradingState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
