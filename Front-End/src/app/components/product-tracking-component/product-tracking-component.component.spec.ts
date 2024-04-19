import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTrackingComponentComponent } from './product-tracking-component.component';

describe('ProductTrackingComponentComponent', () => {
  let component: ProductTrackingComponentComponent;
  let fixture: ComponentFixture<ProductTrackingComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductTrackingComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductTrackingComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
