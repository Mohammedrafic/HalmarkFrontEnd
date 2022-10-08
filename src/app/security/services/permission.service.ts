import { Injectable } from '@angular/core';
import { Select } from '@ngxs/store';
import { UserState } from '../../store/user.state';
import { filter, map, Observable, takeUntil } from 'rxjs';
import { CurrentUserPermission } from '@shared/models/permission.model';
import { PermissionTypes } from '@shared/enums/permissions-types.enum';
import { DestroyableDirective } from '@shared/directives/destroyable.directive';

export interface PermissionsModel {
  canCreateOrder: boolean;
  canCloseOrder: boolean;
}

export type CustomPermissionModel = { [key: string]: PermissionTypes  };
export type CustomPermissionObject = { [key: string]: boolean  };

@Injectable({
  providedIn: 'root',
})
export class PermissionService extends DestroyableDirective {
  @Select(UserState.currentUserPermissionsIds) private currentUserPermissions$: Observable<number[]>;

  constructor() {
    super();
  }

  public getPermissions(): Observable<PermissionsModel> {
    return this.currentUserPermissions$.pipe(
      filter((permissionIds: number[]) => !!permissionIds?.length),
      takeUntil(this.destroy$),
      map((permissionIds: number[]) => {
        return {
          canCreateOrder: permissionIds.includes(PermissionTypes.CanCreateOrder),
          canCloseOrder: permissionIds.includes(PermissionTypes.CanCloseOrder),
        };
      })
    );
  }

  public checkPermisionFor<T>(model: CustomPermissionModel): Observable<T> {
    return this.currentUserPermissions$.pipe(
      filter((permissionIds: number[]) => !!permissionIds?.length),
      takeUntil(this.destroy$),
      map((permissionIds: number[]) => {
        const permissionObject: any = {};
        Object.entries(model).forEach(([key, permission]) => permissionObject[key] = permissionIds.includes(permission))
        return permissionObject as T;
      })
    );
  }
}
