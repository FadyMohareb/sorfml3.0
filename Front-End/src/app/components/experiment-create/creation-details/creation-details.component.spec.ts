import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationDetailsComponent } from './creation-details.component';

describe('CreationDetailsComponent', () => {
  let component: CreationDetailsComponent;
  let fixture: ComponentFixture<CreationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreationDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
