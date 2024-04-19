import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentHcaComponent } from './experiment-hca.component';

describe('ExperimentHcaComponent', () => {
  let component: ExperimentHcaComponent;
  let fixture: ComponentFixture<ExperimentHcaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentHcaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentHcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
