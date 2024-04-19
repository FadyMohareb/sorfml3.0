import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAssetDialogComponent } from './delete-asset-dialog.component';

describe('DeleteAssetDialogComponent', () => {
  let component: DeleteAssetDialogComponent;
  let fixture: ComponentFixture<DeleteAssetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteAssetDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAssetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
