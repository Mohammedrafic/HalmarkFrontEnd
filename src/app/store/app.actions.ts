import { ClientSidebarMenu } from "../shared/models/client-sidebar-menu.model";

export class ToggleMobileView {
  static readonly type = '[app] Toggle mobile view layout';
  constructor(public payload: boolean) { }
}

export class ToggleTheme {
  static readonly type = '[app] Toggle dark-light theme';
  constructor(public payload: boolean) { }
}

export class SetSidebarMenu {
  static readonly type = '[app] Set side bar menu content';
  constructor(public payload: ClientSidebarMenu[]) { }
}

export class SetHeaderState {
  static readonly type = '[app] Set application header state';
  constructor(public payload: any) { }
}

export class ToggleSidebarState {
  static readonly type = '[app] Set side bar dock state';
  constructor(public payload: any) { }
}

export class SetIsFirstLoadState {
  static readonly type = '[app] Set isFirstLoad parameter state';
  constructor(public payload: any) { }
}
