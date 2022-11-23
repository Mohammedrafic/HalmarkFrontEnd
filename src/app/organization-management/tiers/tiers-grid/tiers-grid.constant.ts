import { GridActionRendererComponent } from "@organization-management/tiers/tiers-grid/grid-action-renderer/grid-action-renderer.component";
import { TierDetails } from '@shared/components/tiers-dialog/interfaces';
import { getCorrectFieldValue } from '@organization-management/tiers/helpres';

export const TiersColumnsDefinition = ( editCallback: (tier: TierDetails) => void ) => (
  [
    {
      headerName: '',
      width: 160,
      minWidth: 160,
      sortable: true,
      cellRenderer: GridActionRendererComponent,
      rowDrag: true,
      cellRendererParams: {
        edit: (tier: TierDetails) => {
          editCallback(tier);
        }
      }
    },
    {
      field: 'name',
      headerName: 'TIER NAME',
      sortable: true,
    },
    {
      field: 'priority',
      headerName: 'PRIORITY',
      sortable: true,
    },
    {
      field: 'hours',
      headerName: 'NUMBER OF HOURS',
      sortable: true,
    },
    {
      field: 'regionName',
      headerName: 'REGION',
      sortable: true,
      valueGetter: (params: {data: TierDetails}) => getCorrectFieldValue(params.data.regionName)
    },
    {
      field: 'locationName',
      headerName: 'LOCATION',
      sortable: true,
      valueGetter: (params: {data: TierDetails}) => getCorrectFieldValue(params.data.locationName)
    },
    {
      field: 'departmentName',
      headerName: 'DEPARTMENT',
      sortable: true,
      valueGetter: (params: {data: TierDetails}) => getCorrectFieldValue(params.data.departmentName)
    }
  ]
);
