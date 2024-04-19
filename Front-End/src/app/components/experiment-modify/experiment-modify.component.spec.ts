import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentModifyComponent } from './experiment-modify.component';

describe('ExperimentModifyComponent', () => {
  let component: ExperimentModifyComponent;
  let fixture: ComponentFixture<ExperimentModifyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentModifyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
