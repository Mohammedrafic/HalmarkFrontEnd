import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  GetCandidateDetailsPage,
  GetCandidateRegions,
  GetCandidateSkills,
  SelectNavigation,
  SetCandidateMessage,
  SetNavigation,
  SetPageFilters,
  SetPageNumber,
  SetPageSize,
} from '@shared/components/candidate-details/store/candidate.actions';
import { Observable, tap } from 'rxjs';
import { CandidateDetailsService } from '@shared/components/candidate-details/services/candidate-details.service';
import { CandidateDetailsTabs } from '@shared/enums/candidate-tabs.enum';
import {
  CandidateDetailsPage,
  CandidateMessage,
  CandidatesDetailsRegions,
  FiltersModal,
  NavigationTabModel,
} from '@shared/components/candidate-details/models/candidate.model';
import { MasterSkillByOrganization } from '@shared/models/skill.model';

interface CandidateDetailsStateModel {
  candidateDetailsPage: CandidateDetailsPage | null;
  navigationTab: NavigationTabModel;
  pageNumber: number | null;
  pageSize: number | null;
  candidateSkills: MasterSkillByOrganization | null;
  filters: FiltersModal | null;
  candidateRegions: CandidatesDetailsRegions | null;
  isNavigate: boolean | null;
  message: CandidateMessage;
}

@State<CandidateDetailsStateModel>({
  name: 'candidateDetails',
  defaults: {
    candidateDetailsPage: null,
    navigationTab: {
      active: CandidateDetailsTabs.All,
      pending: null,
      isRedirect: false,
    },
    pageNumber: null,
    pageSize: null,
    candidateSkills: null,
    filters: null,
    candidateRegions: null,
    isNavigate: null,
    message: {
      title: null,
      position: null,
    },
  },
})
@Injectable()
export class CandidateDetailsState {
  @Selector()
  static filtersPage(state: CandidateDetailsStateModel): FiltersModal | null {
    return state.filters;
  }

  @Selector()
  static candidateDetails(state: CandidateDetailsStateModel): CandidateDetailsPage | null {
    return state.candidateDetailsPage;
  }

  @Selector()
  static candidateMessage(state: CandidateDetailsStateModel): CandidateMessage {
    return state.message;
  }

  @Selector()
  static isNavigate(state: CandidateDetailsStateModel): boolean | null {
    return state.isNavigate;
  }

  @Selector()
  static candidateRegions(state: CandidateDetailsStateModel): CandidatesDetailsRegions | null {
    return state.candidateRegions;
  }

  @Selector()
  static navigationTab(state: CandidateDetailsStateModel): NavigationTabModel {
    return state.navigationTab;
  }

  @Selector()
  static pageNumber(state: CandidateDetailsStateModel): number | null {
    return state.pageNumber;
  }

  @Selector()
  static pageSize(state: CandidateDetailsStateModel): number | null {
    return state.pageSize;
  }

  @Selector()
  static candidateSkills(state: CandidateDetailsStateModel): MasterSkillByOrganization | null {
    return state.candidateSkills;
  }

  constructor(private candidateDetailsService: CandidateDetailsService) {}

  @Action(GetCandidateDetailsPage, { cancelUncompleted: true })
  GetCandidateDetailsPage(
    { patchState }: StateContext<CandidateDetailsStateModel>,
    { payload }: GetCandidateDetailsPage
  ): Observable<CandidateDetailsPage> {
    return this.candidateDetailsService.getCandidateDetails(payload).pipe(
      tap((payload: CandidateDetailsPage) => {
        patchState({ candidateDetailsPage: payload });
        return payload;
      })
    );
  }

  @Action(SelectNavigation)
  SelectNavigationTab(
    { patchState }: StateContext<CandidateDetailsStateModel>,
    { active, pending, isRedirect }: SelectNavigation
  ): void {
    patchState({ navigationTab: { active: active!, pending, isRedirect: isRedirect! } });
    patchState({ isNavigate: isRedirect });
  }

  @Action(SetNavigation)
  SetNavigation({ patchState }: StateContext<CandidateDetailsStateModel>, { isNavigate }: SetNavigation): void {
    patchState({ isNavigate });
  }

  @Action(SetPageNumber)
  SetPageNumber({ patchState }: StateContext<CandidateDetailsStateModel>, { pageNumber }: SetPageNumber): void {
    patchState({ pageNumber });
  }

  @Action(SetPageSize)
  SetPageSize({ patchState }: StateContext<CandidateDetailsStateModel>, { pageSize }: SetPageSize): void {
    patchState({ pageSize });
  }

  @Action(SetPageFilters)
  SetPageFilters({ patchState }: StateContext<CandidateDetailsStateModel>, { filters }: SetPageFilters): void {
    patchState({ filters });
  }

  @Action(GetCandidateRegions)
  GetCandidateRegions({ patchState }: StateContext<CandidateDetailsStateModel>): Observable<CandidatesDetailsRegions> {
    return this.candidateDetailsService.getRegions().pipe(
      tap((payload: CandidatesDetailsRegions) => {
        patchState({ candidateRegions: payload });
        return payload;
      })
    );
  }

  @Action(GetCandidateSkills)
  GetCandidateSkills({ patchState }: StateContext<CandidateDetailsStateModel>): Observable<MasterSkillByOrganization> {
    return this.candidateDetailsService.getSkills().pipe(
      tap((payload: MasterSkillByOrganization) => {
        patchState({ candidateSkills: payload });
        return payload;
      })
    );
  }

  @Action(SetCandidateMessage)
  SetCandidateMessage(
    { patchState }: StateContext<CandidateDetailsStateModel>,
    { title, position }: SetCandidateMessage
  ): void {
    patchState({ message: { title, position } });
  }
}
