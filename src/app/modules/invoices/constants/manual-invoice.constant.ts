import { FieldType, FieldWidthStyle } from '@core/enums';
import { AddManInvoiceDialogConfig } from '../interfaces';

export const ManualInvoiceDialogConfig: AddManInvoiceDialogConfig = {
  title: 'Add Manual Invoice',
  fields: [
    {
      field: 'orderId',
      title: 'Order ID | Position ID',
      disabled: false,
      required: true,
      type: FieldType.SearchDD,
      widthStyle: FieldWidthStyle.Long,
    },
    {
      field: 'name',
      title: 'Candidate Name',
      disabled: false,
      required: true,
      type: FieldType.Dropdown,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'unitId',
      title: 'Agency',
      disabled: false,
      required: true,
      type: FieldType.Dropdown,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'locationId',
      title: 'Worked Location',
      disabled: false,
      required: true,
      type: FieldType.Dropdown,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'departmentId',
      title: 'Worked Department',
      disabled: false,
      required: true,
      type: FieldType.Dropdown,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'value',
      title: 'Amount',
      disabled: false,
      required: true,
      type: FieldType.Input,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'date',
      title: 'Service Date',
      disabled: false,
      required: true,
      type: FieldType.Date,
      widthStyle: FieldWidthStyle.Short,
    },
    {
      field: 'link',
      title: 'Linked Invoice',
      disabled: false,
      required: true,
      type: FieldType.Input,
      widthStyle: FieldWidthStyle.Short,
    },

    {
      field: 'vendorFee',
      title: 'Vendor Fee Applicable',
      disabled: false,
      required: true,
      type: FieldType.Toggle,
      widthStyle: FieldWidthStyle.Long,
    },
    {
      field: 'reasonId',
      title: 'Reason Code',
      disabled: false,
      required: true,
      type: FieldType.Dropdown,
      widthStyle: FieldWidthStyle.Long,
    },
    {
      field: 'description',
      title: 'Comments',
      disabled: false,
      required: false,
      type: FieldType.TextArea,
      widthStyle: FieldWidthStyle.Long,
    }
  ],
};
