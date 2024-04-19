import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationDatasetComponent } from './creation-dataset.component';

describe('CreationDatasetComponent', () => {
  let component: CreationDatasetComponent;
  let fixture: ComponentFixture<CreationDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreationDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreationDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
