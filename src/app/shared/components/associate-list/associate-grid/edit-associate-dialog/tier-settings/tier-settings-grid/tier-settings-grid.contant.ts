import { ValueFormatterParams } from '@ag-grid-community/core';
import {
  ActionRendererComponent
} from '@shared/components/associate-list/associate-grid/edit-associate-dialog/tier-settings/tier-settings-grid/action-renderer/action-renderer.component';
import { TierDetails } from '@shared/components/tiers-dialog/interfaces';

export const TiersSettingsColumnsDefinition = ( isAgency: boolean, editCallback: (tier: TierDetails) => void ) => (
  [
    {
      headerName: '',
      width: 140,
      minWidth: 140,
      sortable: true,
      cellRenderer: ActionRendererComponent,
      cellRendererParams: {
        agency: isAgency,
        edit: (tier: TierDetails) => {
          editCallback(tier);
        }
      }
    },
    {
      field: 'regionName',
      headerName: 'REGION',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? params.value : 'All',
    },
    {
      field: 'locationName',
      headerName: 'LOCATION',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? params.value : 'All',
    },
    {
      field: 'departmentName',
      headerName: 'DEPARTMENT',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? params.value : 'All',
    },
    {
      field: 'tierName',
      headerName: 'TIER NAME',
      sortable: true,
    },
  ]
);
