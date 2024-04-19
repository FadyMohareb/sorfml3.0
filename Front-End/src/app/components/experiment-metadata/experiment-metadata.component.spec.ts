import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentMetadataComponent } from './experiment-metadata.component';

describe('ExperimentMetadataComponent', () => {
  let component: ExperimentMetadataComponent;
  let fixture: ComponentFixture<ExperimentMetadataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentMetadataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
