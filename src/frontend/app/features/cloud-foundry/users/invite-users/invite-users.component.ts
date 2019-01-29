import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { UsersRolesExecuteChanges } from '../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../store/app-state';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';

@Component({
  selector: 'app-invite-users',
  templateUrl: './invite-users.component.html',
  styleUrls: ['./invite-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class InviteUsersComponent implements OnInit {

  defaultCancelUrl: string;
  applyStarted = true;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService,
    private route: ActivatedRoute) {
    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

  }

  ngOnInit() {
  }

  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    return `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}` +
      !activeRouteCfOrgSpace.spaceGuid ?
      `/organizations/${activeRouteCfOrgSpace.orgGuid}/users` :
      `/spaces/${activeRouteCfOrgSpace.spaceGuid}/users`; // TODO: RC Test
  }

  startApply: StepOnNextFunction = () => {
    if (this.applyStarted) {
      return observableOf({ success: true, redirect: true });
    }
    this.applyStarted = true;
    this.store.dispatch(new UsersRolesExecuteChanges());
    return observableOf({ success: true, ignoreSuccess: true });
  }
}
