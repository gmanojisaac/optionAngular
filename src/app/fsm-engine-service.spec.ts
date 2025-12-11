import { TestBed } from '@angular/core/testing';

import { FsmEngineService } from './fsm-engine-service';

describe('FsmEngineService', () => {
  let service: FsmEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FsmEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
