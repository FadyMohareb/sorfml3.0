import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentRegressionComponent } from './experiment-regression.component';

describe('ExperimentRegressionComponent', () => {
  let component: ExperimentRegressionComponent;
  let fixture: ComponentFixture<ExperimentRegressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentRegressionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentRegressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
