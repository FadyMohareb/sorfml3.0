import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentPcaComponent } from './experiment-pca.component';

describe('ExperimentPcaComponent', () => {
  let component: ExperimentPcaComponent;
  let fixture: ComponentFixture<ExperimentPcaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentPcaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentPcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
