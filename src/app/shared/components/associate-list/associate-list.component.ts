import { Component, EventEmitter, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { SetHeaderState } from '../../../store/app.actions';
import { Router } from '@angular/router';
import { UserState } from '../../../store/user.state';
import { distinctUntilChanged, takeUntil } from 'rxjs';
import { DestroyableDirective } from '@shared/directives/destroyable.directive';

@Component({
  selector: 'app-associate-list',
  templateUrl: './associate-list.component.html',
  styleUrls: ['./associate-list.component.scss'],
})
export class AssociateListComponent extends DestroyableDirective implements OnInit {
  public isAgency = false;
  public associateEvent = new EventEmitter<boolean>();
  public agencyActionsAllowed = true;

  get getTitle(): string {
    return this.isAgency ? 'Organizations' : 'Agencies';
  }

  constructor(private store: Store, private router: Router) {
    super();

    this.setHeaderName();
  }

  ngOnInit(): void {
    if (this.isAgency) {
      this.checkForAgencyStatus();
    }
  }

  public addNew(): void {
    this.associateEvent.emit(true);
  }

  private setHeaderName(): void {
    this.isAgency = this.router.url.includes('agency');
    this.store.dispatch(
      new SetHeaderState({ title: `Associated ${this.isAgency ? 'Organizations' : 'Agencies'}`, iconName: 'clock' })
    );
  }
  private checkForAgencyStatus(): void {
    this.store
      .select(UserState.agencyActionsAllowed)
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.agencyActionsAllowed = value;
      });
  }
}
