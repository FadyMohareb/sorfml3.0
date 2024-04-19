import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentListNavComponent } from './experiment-list-nav.component';

describe('ExperimentListNavComponent', () => {
  let component: ExperimentListNavComponent;
  let fixture: ComponentFixture<ExperimentListNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentListNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentListNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
