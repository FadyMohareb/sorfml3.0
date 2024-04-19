import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelRegressionComponent } from './model-regression.component';

describe('ModelRegressionComponent', () => {
  let component: ModelRegressionComponent;
  let fixture: ComponentFixture<ModelRegressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelRegressionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelRegressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
