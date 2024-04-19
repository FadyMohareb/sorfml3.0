import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTrackingGoogleMapComponent } from './view-tracking-google-map.component';

describe('ViewTrackingGoogleMapComponent', () => {
  let component: ViewTrackingGoogleMapComponent;
  let fixture: ComponentFixture<ViewTrackingGoogleMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewTrackingGoogleMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTrackingGoogleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
