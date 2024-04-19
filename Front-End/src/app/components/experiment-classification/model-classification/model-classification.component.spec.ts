import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelClassificationComponent } from './model-classification.component';

describe('ModelClassificationComponent', () => {
  let component: ModelClassificationComponent;
  let fixture: ComponentFixture<ModelClassificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelClassificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
