import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { getAllErrors } from '@shared/utils/error.utils';
import { catchError, Observable, of, tap } from 'rxjs';
import { SpecialProject, SpecialProjectPage } from 'src/app/shared/models/special-project.model';
import { GetSpecialProjects,SaveSpecialProject, SaveSpecialProjectSucceeded, SetIsDirtySpecialProjectForm,
  DeletSpecialProject, 
  DeletSpecialProjectSucceeded} from './special-project.actions';
import { SpecialProjectService } from '@shared/services/special-project.service';
import { ShowToast } from 'src/app/store/app.actions';
import { MessageTypes } from 'src/app/shared/enums/message-types';
import { SaveOrderSucceeded } from '@client/store/order-managment-content.actions';
import { RECORD_ADDED } from '@shared/constants';

export interface SpecialProjectStateModel {
  specialProjectPage: SpecialProjectPage | null;
  isSpecialProjectLoading:boolean
}

@State<SpecialProjectStateModel>({
  name: 'specialProjects',
  defaults: {
    specialProjectPage: null,
    isSpecialProjectLoading: false,
  },
})
@Injectable()
export class SpecialProjectState {

  @Selector()
  static specialProjectPage(state: SpecialProjectStateModel): SpecialProjectPage | null {
    return state.specialProjectPage;
  }

  @Selector()
  static isSpecialProjectLoading(state: SpecialProjectStateModel): boolean { return state.isSpecialProjectLoading; }

  
  constructor(private specialProjectService: SpecialProjectService) { }

  @Action(GetSpecialProjects)
  GetSpecialProjects({ patchState }: StateContext<SpecialProjectStateModel>, { }: GetSpecialProjects): Observable<SpecialProjectPage> {
    patchState({ isSpecialProjectLoading: true });
    return this.specialProjectService.getSpecialProjects().pipe(
      tap((payload) => {
        patchState({ isSpecialProjectLoading: false, specialProjectPage: payload });
        return payload;
      })
    );
  }

  @Action(SaveSpecialProject)
  SaveSpecialProject(
    { dispatch }: StateContext<SpecialProjectStateModel>,
    { specialProject }: SaveSpecialProject
  ): Observable<SpecialProject | void> {
    return this.specialProjectService.saveSpecialProject(specialProject).pipe(
      tap((order) => {
        dispatch([
          new ShowToast(MessageTypes.Success, RECORD_ADDED),
          new SaveSpecialProjectSucceeded(),
          new SetIsDirtySpecialProjectForm(false),
        ]);
        return order;
      }),
      catchError((error) => dispatch(new ShowToast(MessageTypes.Error, error.error.detail)))
    );
  }

  @Action(DeletSpecialProject)
  DeletSpecialProject({ dispatch }: StateContext<SpecialProjectStateModel>, { id }: DeletSpecialProject): Observable<any> {
    return this.specialProjectService.removeSpecialProject(id).pipe(
      tap(() => {
        dispatch(new DeletSpecialProjectSucceeded());
      }),
      catchError((error: any) => of(dispatch(new ShowToast(MessageTypes.Error, 'Special Project cannot be deleted'))))
    );
  }
}