import { IrpTabs } from '@client/order-management/enums';
import { TabsConfig } from '@client/order-management/interfaces';

export const FormArrayList = ['contactDetailsList','workLocationList'];
export const IrpTabConfig: TabsConfig[] = [
  {
    id: 0,
    title: 'Order Details',
    subTitle: 'Overall Order Info',
    required: true,
    content: IrpTabs.Details,
  },
  {
    id: 1,
    title: 'Credentials',
    subTitle: 'Set Credentials',
    required: false,
    content: IrpTabs.Credential,
  },
];
