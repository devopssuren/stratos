import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, first, map, mergeMap, switchMap } from 'rxjs/operators';

import { UserFavoriteManager } from '../../../core/src/core/user-favorite-manager';
import { environment } from '../../../core/src/environments/environment.prod';
import { ClearPaginationOfEntity } from '../actions/pagination.actions';
import {
  GetUserFavoritesAction,
  GetUserFavoritesFailedAction,
  GetUserFavoritesSuccessAction,
} from '../actions/user-favourites-actions/get-user-favorites-action';
import {
  RemoveUserFavoriteAction,
  RemoveUserFavoriteSuccessAction,
} from '../actions/user-favourites-actions/remove-user-favorite-action';
import {
  SaveUserFavoriteAction,
  SaveUserFavoriteSuccessAction,
} from '../actions/user-favourites-actions/save-user-favorite-action';
import { ToggleUserFavoriteAction } from '../actions/user-favourites-actions/toggle-user-favorite-action';
import {
  UpdateUserFavoriteMetadataAction,
  UpdateUserFavoriteMetadataSuccessAction,
} from '../actions/user-favourites-actions/update-user-favorite-metadata-action';
import { AppState } from '../app-state';
import { userFavoritesSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { WrapperRequestActionSuccess } from '../types/request.types';
import { IFavoriteMetadata, UserFavorite, userFavoritesPaginationKey } from '../types/user-favorites.types';

const { proxyAPIVersion } = environment;
const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;


@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  private userFavoriteManager = new UserFavoriteManager(this.store);

  @Effect() saveFavorite = this.actions$.ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE).pipe(
    mergeMap(action => {
      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite).pipe(
        mergeMap(newFavorite => {
          return [
            new SaveUserFavoriteSuccessAction(newFavorite)
          ];
        })
      );
    })
  );

  @Effect({ dispatch: false }) getFavorite$ = this.actions$.ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE).pipe(
    switchMap((action: GetUserFavoritesAction) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type
      } as PaginatedAction;
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        map(favorites => {
          const mappedData = favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((data, favorite) => {
            const { guid } = favorite;
            if (guid) {
              data.entities[userFavoritesSchemaKey][guid] = favorite;
              data.result.push(guid);
            }
            return data;
          }, { entities: { [userFavoritesSchemaKey]: {} }, result: [] });
          this.store.dispatch(new WrapperRequestActionSuccess(mappedData, apiAction));
          this.store.dispatch(new GetUserFavoritesSuccessAction(favorites));
        }),
        catchError(e => {
          this.store.dispatch(new GetUserFavoritesFailedAction());
          throw e;
        })
      );
    })
  );

  @Effect() toggleFavorite = this.actions$.ofType<ToggleUserFavoriteAction>(ToggleUserFavoriteAction.ACTION_TYPE).pipe(
    mergeMap(action =>
      this.userFavoriteManager.getIsFavoriteObservable(action.favorite).pipe(
        first(),
        map(isFav => {
          if (isFav) {
            return new RemoveUserFavoriteAction(action.favorite);
          } else {
            return new SaveUserFavoriteAction(action.favorite);
          }
        })
      )
    )
  );

  @Effect({ dispatch: false }) removeFavorite$ = this.actions$.ofType<RemoveUserFavoriteAction>(RemoveUserFavoriteAction.ACTION_TYPE).pipe(
    switchMap((action: RemoveUserFavoriteAction) => {
      const { guid } = action.favorite;
      this.store.dispatch(new RemoveUserFavoriteSuccessAction(action.favorite));
      this.store.dispatch(new ClearPaginationOfEntity(userFavoritesSchemaKey, guid, userFavoritesPaginationKey));
      return this.http.delete<UserFavorite<IFavoriteMetadata>>(`${favoriteUrlPath}/${guid}`);
    })
  );

  @Effect() updateMetadata$ = this.actions$.ofType<UpdateUserFavoriteMetadataAction>(UpdateUserFavoriteMetadataAction.ACTION_TYPE).pipe(
    mergeMap((action: UpdateUserFavoriteMetadataAction) => {
      return this.http.post<UserFavorite<IFavoriteMetadata>>(
        `${favoriteUrlPath}/${action.favorite.guid}/metadata`,
        action.favorite.metadata
      ).pipe(
        map(() => new UpdateUserFavoriteMetadataSuccessAction(action.favorite))
      );
    })
  );
}
