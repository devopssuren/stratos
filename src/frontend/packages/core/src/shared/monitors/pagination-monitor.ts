import { Store } from '@ngrx/store';
import { denormalize, schema as normalizrSchema } from 'normalizr';
import { asapScheduler, Observable } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import {
  combineLatest as combineLatestOperator,
  distinctUntilChanged,
  filter,
  map,
  observeOn,
  publishReplay,
  refCount,
  withLatestFrom,
} from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getAPIRequestDataState, selectEntities } from '../../../../store/src/selectors/api.selectors';
import { selectPaginationState } from '../../../../store/src/selectors/pagination.selectors';
import { PaginationEntityState } from '../../../../store/src/types/pagination.types';


export class PaginationMonitor<T = any> {
  /**
   * Emits the current page of entities.
   */
  public currentPage$: Observable<T[]>;
  /**
   * Emits a boolean stating if the current page is fetching or not.
   */
  public fetchingCurrentPage$: Observable<boolean>;
  /**
   * Emits a boolean stating if the current page has errored or not.
   */
  public currentPageError$: Observable<boolean>;
  /**
   * All the information about the current pagination selection.
   */
  public pagination$: Observable<PaginationEntityState>;


  public currentPageIds$: Observable<string[]>;

  constructor(
    private store: Store<AppState>,
    public paginationKey: string,
    public schema: normalizrSchema.Entity,
  ) {
    this.init(store, paginationKey, schema);
  }

  /**
   * Is the current page ready?
   * @param pagination
   */
  private hasPage(pagination: PaginationEntityState) {
    if (!pagination) {
      return false;
    }
    const currentPage = pagination.ids[pagination.currentPage];
    const hasPageIds = !!currentPage;
    const requestInfo =
      pagination.pageRequests[pagination.clientPagination.currentPage];
    const hasPageRequestInfo = !!requestInfo;
    const hasPage = hasPageIds && (!hasPageRequestInfo || !requestInfo.busy);
    return hasPage;
  }

  /**
   * Gets the request info for the current page.
   * @param pagination
   */
  private getCurrentPageRequestInfo(
    pagination: PaginationEntityState,
  ): ActionState {
    if (
      !pagination ||
      !pagination.pageRequests ||
      !pagination.pageRequests[pagination.currentPage]
    ) {
      return {
        busy: true,
        error: false,
        message: '',
      };
    } else {
      return pagination.pageRequests[pagination.currentPage];
    }
  }

  // ### Initialization methods.
  private init(
    store: Store<AppState>,
    paginationKey: string,
    schema: normalizrSchema.Entity,
  ) {
    this.pagination$ = this.createPaginationObservable(
      store,
      schema.key,
      paginationKey,
    );
    this.currentPageIds$ = this.createPagIdObservable(this.pagination$);
    this.currentPage$ = this.createPageObservable(this.pagination$, schema);
    this.currentPageError$ = this.createErrorObservable(this.pagination$);
    this.fetchingCurrentPage$ = this.createFetchingObservable(this.pagination$);
  }

  private createPaginationObservable(
    store: Store<AppState>,
    entityKey: string,
    paginationKey: string,
  ) {
    return store.select(selectPaginationState(entityKey, paginationKey)).pipe(
      distinctUntilChanged(),
      filter(pag => !!pag),
    );
  }

  private createPagIdObservable(
    pagination$: Observable<PaginationEntityState>
  ) {
    return pagination$.pipe(
      distinctUntilChanged(this.isPageSameIsh),
      map(pagination => pagination.ids[pagination.currentPage] || [])
    );
  }

  private createPageObservable(
    pagination$: Observable<PaginationEntityState>,
    schema: normalizrSchema.Entity,
  ) {
    const entityObservable$ = this.store
      .select(selectEntities<T>(this.schema.key))
      .pipe(distinctUntilChanged());
    const allEntitiesObservable$ = this.store.select(getAPIRequestDataState);
    return pagination$.pipe(
      // Improve efficiency
      observeOn(asapScheduler),
      filter(pagination => this.hasPage(pagination) && !pagination.currentlyMaxed),
      distinctUntilChanged(this.isPageSameIsh),
      combineLatestOperator(entityObservable$),
      withLatestFrom(allEntitiesObservable$),
      map(([[pagination], allEntities]) => {
        const page = pagination.ids[pagination.currentPage] || [];
        return page.length
          ? denormalize(page, [schema], allEntities).filter(ent => !!ent)
          : [];
      }),
      tag('de-norming ' + schema.key),
      publishReplay(1),
      refCount(),
    );
  }

  private isPageSameIsh(x: PaginationEntityState, y: PaginationEntityState) {
    const samePage = x.currentPage === y.currentPage;
    // It's possible that we need to compare the whole page request object but busy will do for now.
    const samePageBusyState =
      samePage &&
      (
        x.pageRequests[x.currentPage]
        &&
        x.pageRequests[x.currentPage].busy
      ) === (
        y.pageRequests[y.currentPage]
        &&
        y.pageRequests[y.currentPage].busy
      );
    const samePageIdList =
      samePage && x.ids[x.currentPage] === y.ids[y.currentPage];
    return samePageIdList && samePageBusyState;
  }

  private createErrorObservable(
    pagination$: Observable<PaginationEntityState>,
  ) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return !currentPageRequest.busy && currentPageRequest.error;
      }),
    );
  }

  private createFetchingObservable(
    pagination$: Observable<PaginationEntityState>,
  ) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return currentPageRequest.busy;
      }),
      distinctUntilChanged(),
    );
  }
  // ### Initialization methods end.
}
