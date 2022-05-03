import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { FreezeService, SortService } from '@syncfusion/ej2-angular-grids';
import { debounceTime, filter, Observable, Subject } from 'rxjs';
import { GetAllSkillsCategories, GetMasterSkillsByPage, RemoveMasterSkill, RemoveMasterSkillSucceeded, SaveMasterSkill, SaveMasterSkillSucceeded, SetDirtyState } from 'src/app/admin/store/admin.actions';
import { AdminState } from 'src/app/admin/store/admin.state';
import { AbstractGridConfigurationComponent } from 'src/app/shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { Skill } from 'src/app/shared/models/skill.model';
import { ConfirmService } from 'src/app/shared/services/confirm.service';
import { ShowSideDialog } from 'src/app/store/app.actions';

@Component({
  selector: 'app-skills-grid',
  templateUrl: './skills-grid.component.html',
  styleUrls: ['./skills-grid.component.scss'],
  providers: [SortService, FreezeService]
})
export class SkillsGridComponent extends AbstractGridConfigurationComponent implements OnInit {
  private pageSubject = new Subject<number>();
  public optionFields = {
    text: 'name', value: 'id'
  };

  @Input() isActive: boolean = false;

  @Select(AdminState.masterSkills)
  masterSkills$: Observable<any>;

  @Select(AdminState.allSkillsCategories)
  allSkillsCategories$: Observable<any>;

  public SkillFormGroup: FormGroup;

  constructor(private store: Store,
              private actions$: Actions,
              private fb: FormBuilder,
              private confirmService: ConfirmService) {
    super();
    this.SkillFormGroup = this.fb.group({
      id: new FormControl(0),
      skillCategoryId: new FormControl('', [ Validators.required, Validators.minLength(3) ]),
      skillAbbr: new FormControl(''),
      skillDescription: new FormControl('', [ Validators.required, Validators.minLength(3) ]),
    });
  }

  ngOnInit() {
    this.store.dispatch(new GetAllSkillsCategories());
    this.store.dispatch(new GetMasterSkillsByPage(this.currentPage, this.pageSize));
    this.pageSubject.pipe(debounceTime(1)).subscribe((page) => {
      this.currentPage = page;
      this.store.dispatch(new GetMasterSkillsByPage(this.currentPage, this.pageSize));
    });
    this.actions$.pipe(ofActionSuccessful(SaveMasterSkillSucceeded)).subscribe(() => {
      this.closeDialog();
      this.store.dispatch(new GetMasterSkillsByPage(this.currentPage, this.pageSize));
      this.SkillFormGroup.reset();
    });
    this.actions$.pipe(ofActionSuccessful(RemoveMasterSkillSucceeded)).subscribe(() => {
      this.store.dispatch(new GetMasterSkillsByPage(this.currentPage, this.pageSize));
    });
  }

  public editSkill(data: any): void {
    this.SkillFormGroup.setValue({
      id: data.id,
      skillAbbr: data.skillAbbr,
      skillCategoryId: data.skillCategory.id,
      skillDescription: data.skillDescription
    });
    this.store.dispatch(new ShowSideDialog(true));
  }

  public deleteSkill(data: any): void {
    this.confirmService
      .confirm('Are you sure want to delete?', {
         title: 'Delete Record',
         okButtonLabel: 'Delete',
         okButtonClass: 'delete-button'
      })
      .pipe(filter((confirm) => !!confirm))
      .subscribe(() => {
        this.store.dispatch(new RemoveMasterSkill(data));
      });
  }

  public closeDialog(): void {
    this.store.dispatch(new ShowSideDialog(false));
    this.SkillFormGroup.reset();
  }

  public saveSkill(): void {
    if (this.SkillFormGroup.valid) {
      this.store.dispatch(new SaveMasterSkill(new Skill(
        this.SkillFormGroup.getRawValue(),
      )));
      this.store.dispatch(new SetDirtyState(false));
    } else {
      this.SkillFormGroup.markAllAsTouched();
    }
  }
  
  public onRowsDropDownChanged(): void {
    this.pageSize = parseInt(this.activeRowsPerPageDropDown);
  }

  public onGoToClick(event: any): void {
    if (event.currentPage || event.value) {
      this.pageSubject.next(event.currentPage || event.value);
    }
  }

}
