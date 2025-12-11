import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FsmTestShellComponent } from './fsm-test-shell.component';

describe('FsmTestShellComponent', () => {
  let component: FsmTestShellComponent;
  let fixture: ComponentFixture<FsmTestShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FsmTestShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FsmTestShellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
