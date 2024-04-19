import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAssetComponent } from './update-asset.component';

describe('UpdateAssetComponent', () => {
  let component: UpdateAssetComponent;
  let fixture: ComponentFixture<UpdateAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateAssetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
