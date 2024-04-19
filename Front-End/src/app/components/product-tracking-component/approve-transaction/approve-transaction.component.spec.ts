import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveTransactionComponent } from './approve-transaction.component';

describe('ApproveTransactionComponent', () => {
  let component: ApproveTransactionComponent;
  let fixture: ComponentFixture<ApproveTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApproveTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
