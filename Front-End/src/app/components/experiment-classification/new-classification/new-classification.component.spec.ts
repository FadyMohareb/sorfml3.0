import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewClassificationComponent } from './new-classification.component';

describe('NewClassificationComponent', () => {
  let component: NewClassificationComponent;
  let fixture: ComponentFixture<NewClassificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewClassificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
