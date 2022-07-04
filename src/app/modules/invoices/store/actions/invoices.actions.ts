import { GetInvoicesData } from '../../interfaces';
import { INVOICES_ACTIONS } from '../../enums/invoices.enum';
import { DialogAction } from '../../../timesheets/enums';

export namespace Invoices {
  export class Get {
    static readonly type = INVOICES_ACTIONS.GET;

    constructor(public readonly payload: GetInvoicesData) {}
  }

  export class ToggleInvoiceDialog {
    static readonly type = INVOICES_ACTIONS.TOGGLE_INVOICE_DIALOG;

    constructor(public readonly action: DialogAction, public readonly id?: number) {}
  }
}
