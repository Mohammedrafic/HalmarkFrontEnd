import { Component, OnInit } from '@angular/core';

import { Select, Store } from '@ngxs/store';
import { SetHeaderState } from '../store/app.actions';
import { ORG_SETTINGS } from './organization-management-menu.config';
import { AbstractPermission } from '@shared/helpers/permissions';
import { MenuSettings } from '@shared/models';
import { Permission } from '@core/interface';
import { filter, Observable, switchMap, takeUntil } from 'rxjs';
import { UserState } from '../store/user.state';
import { GetOrganizationById } from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';
import { AppState } from '../store/app.state';

@Component({
  selector: 'app-organization-management',
  templateUrl: './organization-management.component.html',
  styleUrls: ['./organization-management.component.scss']
})
export class OrganizationManagementComponent extends AbstractPermission implements OnInit {
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;

  public sideMenuConfig: MenuSettings[];

  private orgSettings = ORG_SETTINGS;
  private isIRPFlagEnabled = false;

  constructor(protected override store: Store) {
    super(store);

    store.dispatch(new SetHeaderState({ title: 'Settings', iconName: 'settings' }));
    this.checkIRPFlag();
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.startOrgIdWatching();
    this.setMenuConfig();
    this.watchForPermissions();
  }

  private watchForPermissions(): void {
    const itemsWithoutPermissions = this.orgSettings.filter((item: MenuSettings) => !item.permissionKeys).length;

    this.getPermissionStream().pipe(
      filter(() => this.sideMenuConfig.length <= itemsWithoutPermissions),
      takeUntil(this.componentDestroy())
    ).subscribe((permissions: Permission) => {
        this.userPermission = permissions;
        this.setMenuConfig();
    });
  }

  private setMenuConfig(): void {
    this.sideMenuConfig = this.checkValidPermissions(this.orgSettings);
  }

  private startOrgIdWatching(): void {
    this.organizationId$.pipe(
      switchMap((id) => this.getOrganization(id)),
      takeUntil(this.componentDestroy())
    ).subscribe(() => {
      this.checkOrgPreferences();
    });
  }

  private getOrganization(businessUnitId: number): Observable<void> {
    const id = businessUnitId || this.store.selectSnapshot(UserState.user)?.businessUnitId as number;

    return this.store.dispatch(new GetOrganizationById(id));
  }

  private checkOrgPreferences(): void {
    const { isIRPEnabled, isVMCEnabled } = this.store.selectSnapshot(OrganizationManagementState.organization)?.preferences || {};
    const isIRPOnly = this.isIRPFlagEnabled && !!(isIRPEnabled && !isVMCEnabled);

    if (isIRPOnly) {
      const filteredKeys = new Set([8, 9]);

      this.orgSettings = this.orgSettings.filter(el => !filteredKeys.has(el.id));

      this.setMenuConfig();
    }
  }

  private checkIRPFlag(): void {
    this.isIRPFlagEnabled = this.store.selectSnapshot(AppState.isIrpFlagEnabled);
  }
}
