import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRegressionComponent } from './new-regression.component';

describe('NewRegressionComponent', () => {
  let component: NewRegressionComponent;
  let fixture: ComponentFixture<NewRegressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewRegressionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRegressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
