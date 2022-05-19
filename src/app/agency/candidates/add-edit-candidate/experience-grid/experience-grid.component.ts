import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { GridComponent } from "@syncfusion/ej2-angular-grids";
import { delay, filter, Observable } from "rxjs";

import {
  GetExperienceByCandidateId,
  RemoveExperience,
  RemoveExperienceSucceeded,
  SaveExperience,
  SaveExperienceSucceeded
} from "src/app/agency/store/candidate.actions";
import { CandidateState } from "src/app/agency/store/candidate.state";
import { AbstractGridConfigurationComponent } from "src/app/shared/components/abstract-grid-configuration/abstract-grid-configuration.component";
import { CANCEL_COFIRM_TEXT, DELETE_RECORD_TEXT, DELETE_RECORD_TITLE } from "src/app/shared/constants/messages";
import { Experience } from "src/app/shared/models/experience.model";
import { ConfirmService } from "src/app/shared/services/confirm.service";
import { ShowSideDialog } from "src/app/store/app.actions";

@Component({
  selector: 'app-experience-grid',
  templateUrl: './experience-grid.component.html',
  styleUrls: ['./experience-grid.component.scss']
})
export class ExperienceGridComponent extends AbstractGridConfigurationComponent implements OnInit {
  @ViewChild('grid') grid: GridComponent;

  @Select(CandidateState.experiences)
  experiences$: Observable<Experience[]>;

  public title = '';
  public experienceForm: FormGroup;

  constructor(private store: Store,
              private fb: FormBuilder,
              private actions$: Actions,
              private confirmService: ConfirmService) {
    super();
  }

  ngOnInit(): void {
    this.store.dispatch(new GetExperienceByCandidateId());
    this.createExperienceForm();

    this.actions$.pipe(ofActionSuccessful(SaveExperienceSucceeded)).subscribe(() => {
      this.store.dispatch(new GetExperienceByCandidateId());
      this.experienceForm.markAsPristine();
      this.closeDialog();
    });
    this.actions$.pipe(ofActionSuccessful(RemoveExperienceSucceeded)).subscribe(() => {
      this.store.dispatch(new GetExperienceByCandidateId());
    });
  }

  public dataBound(): void {
    this.grid.autoFitColumns();
  }

  public onEdit(experience: Experience) {
    this.title = 'Edit';
    this.experienceForm.setValue({
      id: experience.id,
      candidateProfileId: experience.candidateProfileId,
      employer: experience.employer,
      jobTitle: experience.jobTitle,
      startDate: experience.startDate,
      endDate: experience.endDate,
      comments: experience.comments
    });
    this.store.dispatch(new ShowSideDialog(true));
  }

  public onRemove(data: Experience) {
    this.confirmService
      .confirm(DELETE_RECORD_TEXT, {
        title: DELETE_RECORD_TITLE,
        okButtonLabel: 'Delete',
        okButtonClass: 'delete-button'
      })
      .pipe(filter((confirm) => !!confirm))
      .subscribe(() => {
        this.store.dispatch(new RemoveExperience(data));
      });
  }

  public addNew(): void {
    this.title = 'Add';
    this.store.dispatch(new ShowSideDialog(true));
  }

  public onFilter(): void {

  }

  public closeDialog(): void {
    if (this.experienceForm.dirty) {
      this.confirmService
        .confirm(CANCEL_COFIRM_TEXT)
        .pipe(filter((confirm) => !!confirm))
        .subscribe(() => {
          this.closeSideDialog()
        });
    } else {
      this.closeSideDialog()
    }
  }

  public saveExperience(): void {
    if (this.experienceForm.valid) {
      this.store.dispatch(new SaveExperience(this.experienceForm.getRawValue()));
    } else {
      this.experienceForm.markAllAsTouched();
    }
  }

  private  createExperienceForm(): void {
    this.experienceForm = this.fb.group({
      id: new FormControl(null),
      candidateProfileId: new FormControl(null),
      employer: new FormControl(null, [ Validators.maxLength(100) ]),
      jobTitle: new FormControl(null, [ Validators.maxLength(20) ]),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      comments: new FormControl(null, [ Validators.maxLength(500) ])
    });
  }

  private closeSideDialog(): void {
    this.store.dispatch(new ShowSideDialog(false)).pipe(delay(500)).subscribe(() => {
      this.experienceForm.reset();
    });
  }
}
