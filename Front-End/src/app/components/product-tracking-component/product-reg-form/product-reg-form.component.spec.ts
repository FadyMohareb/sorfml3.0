import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRegFormComponent } from './product-reg-form.component';

describe('ProductRegFormComponent', () => {
  let component: ProductRegFormComponent;
  let fixture: ComponentFixture<ProductRegFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductRegFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductRegFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
