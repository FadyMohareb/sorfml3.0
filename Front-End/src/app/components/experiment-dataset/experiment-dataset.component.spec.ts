import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentDatasetComponent } from './experiment-dataset.component';

describe('ExperimentDatasetComponent', () => {
  let component: ExperimentDatasetComponent;
  let fixture: ComponentFixture<ExperimentDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
