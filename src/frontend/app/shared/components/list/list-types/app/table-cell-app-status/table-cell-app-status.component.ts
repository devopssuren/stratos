import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { AppState } from '../../../../../../store/app-state';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ApplicationStateData, ApplicationStateService } from '../../../../application-state/application-state.service';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-app-status',
  templateUrl: './table-cell-app-status.component.html',
  styleUrls: ['./table-cell-app-status.component.scss'],
})
export class TableCellAppStatusComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  applicationState: ApplicationStateData;
  fetchAppState$: Observable<ApplicationStateData>;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    super();
  }

  ngOnInit() {
    const applicationState = this.appStateService.get(this.row.entity, null);
    this.fetchAppState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.entity.guid,
      this.row.entity.cfGuid)
      .pipe(
      startWith(applicationState)
      );
  }

}
