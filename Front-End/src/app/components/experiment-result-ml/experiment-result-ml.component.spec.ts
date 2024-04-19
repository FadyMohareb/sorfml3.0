import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentResultMLComponent } from './experiment-result-ml.component';

describe('ExperimentResultMLComponent', () => {
  let component: ExperimentResultMLComponent;
  let fixture: ComponentFixture<ExperimentResultMLComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentResultMLComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentResultMLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
