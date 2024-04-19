import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTransactionHistoryComponent } from './view-transaction-history.component';

describe('ViewTransactionHistoryComponent', () => {
  let component: ViewTransactionHistoryComponent;
  let fixture: ComponentFixture<ViewTransactionHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewTransactionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
