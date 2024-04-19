import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkExperimentComponent } from './link-experiment.component';

describe('LinkExperimentComponent', () => {
  let component: LinkExperimentComponent;
  let fixture: ComponentFixture<LinkExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkExperimentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
