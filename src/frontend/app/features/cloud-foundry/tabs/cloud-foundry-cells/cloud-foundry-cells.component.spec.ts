import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CfCellsListConfigService,
} from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfCell } from '../../cf-page.types';
import { CloudFoundryCellsComponent } from './cloud-foundry-cells.component';

describe('CloudFoundryCellsComponent', () => {
  let component: CloudFoundryCellsComponent;
  let fixture: ComponentFixture<CloudFoundryCellsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellsComponent],
      imports: [...BaseTestModules],
      providers: [
        CfCellsListConfigService,
        ActiveRouteCfCell
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
