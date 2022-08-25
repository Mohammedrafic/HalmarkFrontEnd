import { Attachment } from '@shared/components/attachments';
import { PageOfCollections } from '@shared/models/page.model';
import { InvoiceType } from '../enums/invoice-type.enum';
import { BaseInvoice } from './base-invoice.interface';
import { InvoiceRecordType } from '../enums';
import { InvoiceAttachment } from './invoice-attachment.interface';

export type PendingInvoicesData = PageOfCollections<PendingInvoice>;

export interface PendingInvoice extends BaseInvoice {
  timesheetType: InvoiceType;
  timesheetTypeText: string;

  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  rejectionReason: string | null;
  invoiceRecords: PendingInvoiceRecord[];
  attachments: Attachment[];
  rate: number | null;
  bonus: number | null;
  expenses: number | null;
  hours: number | null;
  miles: number | null;
  amount: number;
}

export interface PendingInvoiceRecord {
  id: number;
  invoiceRecordType: InvoiceRecordType;
  invoiceRecordTypeText: string;
  dateTime: string;
  billRateConfigId: number;
  billRateConfigTitle: string;
  timeIn: TimeSpan;
  timeOut: TimeSpan;
  vendorFeeApplicable: boolean;
  comment: string;
  reasonId: number;
  reasonCode: string;
  linkedInvoiceId: number;
  rate: number;
  value: number;
  total: number;
  timesheetId: number;
  attachments: InvoiceAttachment[];
}

export interface TimeSpan {
  ticks: number;
  days: number;
  hours: number;
  milliseconds: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMilliseconds: number;
  totalMinutes: number;
  totalSeconds: number;
}
