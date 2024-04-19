import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAssetTableComponent } from './list-asset-table.component';

describe('ListAssetTableComponent', () => {
  let component: ListAssetTableComponent;
  let fixture: ComponentFixture<ListAssetTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAssetTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAssetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
