import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { FetchCommits } from '../../../../../../../store/src/actions/deploy-applications.actions';
import { EntitySchema, gitCommitSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { GitCommit } from '../../../../../../../store/src/types/git.types';
import { GitSCM } from '../../../../data-services/scm/scm';


export class GithubCommitsDataSource extends ListDataSource<APIResource<GitCommit>> {
  store: Store<AppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param {Store<AppState>} store
   * @param {IListConfig<APIResource<GithubCommit>>} listConfig
   * @param {string} projectName For example `cloudfoundry-incubator/stratos`
   * @param {string} sha Branch name, tag, etc
   * @memberof GithubCommitsDataSource
   */
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource<GitCommit>>,
    scm: GitSCM,
    projectName: string,
    sha: string,
    commitSha?: string,
  ) {
    const action = new FetchCommits(scm, projectName, sha);
    const paginationKey = action.paginationKey;
    const rowsState = observableOf(commitSha ? {
      [commitSha]: {
        highlighted: true
      }
    } : {});
    super({
      store,
      action,
      schema: new EntitySchema(gitCommitSchemaKey),
      getRowUniqueId: object => object.entity.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig,
      rowsState
    });
  }
}
