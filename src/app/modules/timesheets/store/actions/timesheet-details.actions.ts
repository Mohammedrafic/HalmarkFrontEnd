import { ExportPayload } from '@shared/models/export.model';
import { TimesheetDetailsActions, TIMESHEETS_ACTIONS } from '../../enums';
import {
  ChangeStatusData,
  DeleteAttachmentData,
  DownloadAttachmentData,
  TimesheetUploadFilesData
} from '../../interface';

export namespace TimesheetDetails {
  export class Export {
    static readonly type = '[timesheet details] Export';
    constructor(public readonly payload: ExportPayload) { }
  }

  export class GetTimesheetRecords {
    static readonly type = TimesheetDetailsActions.GetTimesheetRecords;

    constructor(
      public readonly id: number,
      public readonly orgId: number,
      public readonly isAgency: boolean,
      ) {}
  }

  export class AgencySubmitTimesheet {
    static readonly type = TIMESHEETS_ACTIONS.AGENCY_SUBMIT_TIMESHEET;

    constructor(
      public readonly id: number,
      public readonly orgId: number,
    ) {
    }
  }

  export class OrganizationApproveTimesheet {
    static readonly type = TIMESHEETS_ACTIONS.ORGANIZATION_APPROVE_TIMESHEET;

    constructor(
      public readonly id: number,
      public readonly orgId: number | null,
    ) {
    }
  }

  // for organization/agency submit/approve
  export class SubmitTimesheet {
    static readonly type = TIMESHEETS_ACTIONS.ORGANIZATION_APPROVE_TIMESHEET;

    constructor(
      public readonly id: number,
      public readonly orgId: number | null,
    ) {
    }
  }

  export class ChangeTimesheetStatus {
    static readonly type = TIMESHEETS_ACTIONS.REJECT_TIMESHEET;

    constructor(
      public readonly payload: ChangeStatusData
    ) {
    }
  }

  export class PatchTimesheetRecords {
    static readonly type = TimesheetDetailsActions.PatchTimesheetRecords;

    constructor(
      public readonly id: number,
      public readonly recordsToUpdate: Record<string, string | number>[],
      public readonly isAgency: boolean,
      ) {}
  }

  export class UploadFiles {
    static readonly type = TimesheetDetailsActions.UploadFiles;

    constructor(public payload: TimesheetUploadFilesData) {
    }
  }

  export class DeleteAttachment {
    static readonly type = TimesheetDetailsActions.DeleteFile;

    constructor(public payload: DeleteAttachmentData) {
    }
  }

  export class GetBillRates {
    static readonly type = TimesheetDetailsActions.GetCandidateBillRates;

    constructor(
      public readonly jobId: number,
      public readonly orgId: number,
      public readonly isAgency: boolean,
    ) {}
  }

  export class GetCostCenters {
    static readonly type = TimesheetDetailsActions.GetCandidateCostCenters;

    constructor(
      public readonly jobId: number,
      public readonly orgId: number,
      public readonly isAgency: boolean,
    ) {}
  }

  export class DownloadAttachment {
    static readonly type = TimesheetDetailsActions.DownloadAttachment;

    constructor(
      public payload: DownloadAttachmentData,
    ) {}
  }

  export class FileLoaded {
    static readonly type = '[timesheet details] file loaded';

    constructor(
      public file: Blob,
    ) {}
  }

  export class AddTimesheetRecord {
    static readonly type = TimesheetDetailsActions.AddTimesheetRecord;

    constructor(
      public timesheetId: number,
    ) {}
  }

  export class NoWorkPerformed {
    static readonly type = TimesheetDetailsActions.NoWorkPerformed;

    constructor(
      public timesheetId: number,
      public organizationId: number | null,
    ) {}
  }
}
