import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { formatDate } from '@angular/common';

import { CandidateInfoUIItem, TimesheetDetailsModel } from '../../interface';

@Component({
  selector: 'app-profile-details-job-info',
  templateUrl: './profile-details-job-info.component.html',
  styleUrls: ['./profile-details-job-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDetailsJobInfoComponent implements OnChanges {
  public items: CandidateInfoUIItem[] = [];

  @Input() public isAgency = false;

  @Input()
  public jobData: TimesheetDetailsModel | null;

  constructor(
    private router: Router,
  ) {
    this.isAgency = this.router.url.includes('agency');
  }

  public ngOnChanges(): void {
    if (this.jobData) {
      this.items = this.getUIItems(this.jobData);
    }
  }

  public trackByTitle(_: number, item: CandidateInfoUIItem): string {
    return item.title;
  }

  private getUIItems(data: TimesheetDetailsModel): CandidateInfoUIItem[] {
    return [
      {
        title: 'Job Title',
        icon: 'user',
        value: data.orderTitle,
      },
      {
        title: 'Region / Location',
        icon: 'map-pin',
        value: data.orderLocationName,
      },
      {
        title: 'Department',
        icon: 'folder',
        value: data.orderDepartmentName,
      },
      {
        title: 'Skill',
        icon: 'folder',
        value: data.orderSkillName,
      },
      {
        title: 'Start - End Date',
        icon: 'calendar',
        value: `${formatDate(data.jobStartDate, 'MM/dd/yyyy', 'en-US', 'utc')}
         - ${formatDate(data.jobEndDate, 'MM/dd/yyyy', 'en-US', 'utc')}`,
      },
      {
        title: !this.isAgency ? 'Agency' : 'Organization',
        icon: 'briefcase',
        value: data.unitName,
      },
    ];
  }
}
