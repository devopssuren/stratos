import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/core.module';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { TableCellEndpointIsAdminComponent } from './table-cell-endpoint-is-admin.component';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';


describe('TableCellEndpointIsAdminComponent', () => {
  let component: TableCellEndpointIsAdminComponent<{}>;
  let fixture: ComponentFixture<TableCellEndpointIsAdminComponent<{}>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointIsAdminComponent, BooleanIndicatorComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointIsAdminComponent);
    component = fixture.componentInstance;
    component.row = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
