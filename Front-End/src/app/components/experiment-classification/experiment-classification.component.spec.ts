import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentClassificationComponent } from './experiment-classification.component';

describe('ExperimentClassificationComponent', () => {
  let component: ExperimentClassificationComponent;
  let fixture: ComponentFixture<ExperimentClassificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentClassificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
