import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { SetHeaderState, ShowExportDialog, ShowFilterDialog } from 'src/app/store/app.actions';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { AbstractGridConfigurationComponent } from '@shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { TAB_CANDIDATES } from '@client/candidates/candidates-content/candidates.constant';
import { TabConfig } from '../interface';
import { UserState } from 'src/app/store/user.state';
import { GetOrganizationById } from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';

@Component({
  selector: 'app-candidates-content',
  templateUrl: './candidates-content.component.html',
  styleUrls: ['./candidates-content.component.scss'],
})
export class CandidatesContentComponent extends AbstractGridConfigurationComponent implements OnInit, OnDestroy {
  public includeDeployedCandidates$: Subject<boolean> = new Subject<boolean>();
  public filteredItems$ = new Subject<number>();
  public exportUsers$ = new Subject<ExportedFileType>();
  public search$ = new Subject<string>();
  public activeTabIndex: number;
  public isIRP: boolean = false;
  public preferencesLoaded: boolean = false;
  public readonly tabConfig: TabConfig[] = TAB_CANDIDATES;

  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(private store: Store, private router: Router, private route: ActivatedRoute) {
    super();
    store.dispatch(new SetHeaderState({ title: 'Candidate List', iconName: 'users' }));
  }

  ngOnInit(): void {
    this.startOrgIdWatching();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public onSwitcher(event: { checked: boolean }): void {
    this.includeDeployedCandidates$.next(event.checked);
  }

  public handleChangeTab(tabIndex: number): void {
    this.activeTabIndex = tabIndex;
  }

  public showFilters(): void {
    this.store.dispatch(new ShowFilterDialog(true));
  }

  public navigateToCandidateForm(): void {
    this.router.navigate(['./add'], { relativeTo: this.route });
  }

  public override customExport(): void {
    this.store.dispatch(new ShowExportDialog(true));
  }

  public override defaultExport(fileType: ExportedFileType): void {
    this.exportUsers$.next(fileType);
  }

  private startOrgIdWatching(): void {
    this.organizationId$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(id => {
      this.getOrganization(id);
    });
  }

  private getOrganization(businessUnitId: number) {
    const id = businessUnitId || this.store.selectSnapshot(UserState.user)?.businessUnitId as number;

    this.store.dispatch(new GetOrganizationById(id)).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.checkOrgPreferences();
    });
  }

  private checkOrgPreferences(): void {
    const { isIRPEnabled } =
    this.store.selectSnapshot(OrganizationManagementState.organization)?.preferences || {};

    this.isIRP = !!isIRPEnabled;
    this.preferencesLoaded = true;
  }
}
