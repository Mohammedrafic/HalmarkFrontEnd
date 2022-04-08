import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { ToggleMobileView, ToggleTheme, SetSidebarMenu, SetHeaderState } from './app.actions';

export interface AppStateModel {
  sideBarMenu: any; // TODO: create model
  isMobile: boolean;
  isDarkTheme: boolean;
  headerState: any; // TODO: create model
  isLoading: boolean;  
}

@State<AppStateModel>({
  name: 'app',
  defaults: {
    sideBarMenu: null,
    isMobile: false,
    isDarkTheme: false,
    headerState: null,
    isLoading: false,
  }
})

@Injectable()
export class AppState {

  @Selector()
  static isMobile(state: AppStateModel): boolean { return state.isMobile; }

  @Selector()
  static isLoading(state: AppStateModel): boolean { return state.isLoading; }

  @Selector()
  static sideBarMenu(state: AppStateModel): boolean { return state.sideBarMenu; }

  @Selector()
  static headerState(state: AppStateModel): boolean { return state.headerState; }

  constructor() { }

  @Action(ToggleMobileView)
  ToggleMobileView({ patchState }: StateContext<AppStateModel>, { payload }: ToggleMobileView): void {
    patchState({ isMobile: payload });
  }

  @Action(ToggleTheme)
  ToggleTheme({ patchState }: StateContext<AppStateModel>, { payload }: ToggleTheme): void {
    patchState({ isDarkTheme: payload });
  }

  @Action(SetSidebarMenu)
  SetSidebarMenu({ patchState }: StateContext<AppStateModel>, { payload }: SetSidebarMenu): void {
    patchState({ sideBarMenu: payload });
  }

  @Action(SetHeaderState)
  SetHeaderState({ patchState }: StateContext<AppStateModel>, { payload }: SetHeaderState): void {
    patchState({ headerState: payload });
  }
}
