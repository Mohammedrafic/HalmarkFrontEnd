import { FormGroup } from '@angular/forms';
import { FieldType } from '@core/enums';
import { DropdownOption } from '@core/interface';
import { PaymentMode } from '../../enums';

export interface PaymentFormConfig {
  title: string;
  field: string;
  type: FieldType;
  required?: boolean;
  options?: DropdownOption[],
}

export interface CheckForm {
  id?: number;
  date: Date;
  checkNumber: string;
  checkDate: Date;
  initialAmount: number;
  paymentMode: PaymentMode;
  isRefund: boolean;
}

export interface PaymentsTableData {
  id: number | null;
  invoiceNumber: string;
  amount: number;
  payment: number;
  balance: number;
  group: FormGroup;
}

export interface PaymentForm {
  id: number;
  amount: number;
  balance: number;
}
