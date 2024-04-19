import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationMetadataComponent } from './creation-metadata.component';

describe('CreationMetadataComponent', () => {
  let component: CreationMetadataComponent;
  let fixture: ComponentFixture<CreationMetadataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreationMetadataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreationMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
