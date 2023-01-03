import { WorkCommitmentDetails, WorkCommitmentGrid } from '../interfaces';
import { getCorrectLocationValue, getCorrectSkillsValue } from '../helpers';
import { WorkCommitmentButtonRenderer } from '../components/work-commitment-button-renderer/work-commitment-button-renderer';

export const WorkCommitmentColumnsDefinition = (editCallback: (commitment: WorkCommitmentGrid) => void) => [
  {
    headerName: '',
    minWidth: 130,
    sortable: false,
    cellRenderer: WorkCommitmentButtonRenderer,
    rowDrag: false,
    cellRendererParams: {
      edit: (commitment: WorkCommitmentGrid) => {
        editCallback(commitment);
      },
    },
  },
  {
    field: 'masterWorkCommitmentName',
    headerName: 'NAME',
    minWidth: 200,
    sortable: true,
  },
  {
    field: 'regionName',
    headerName: 'REGION',
    minWidth: 140,
    sortable: true,
    valueGetter: (params: { data: WorkCommitmentGrid }) => getCorrectLocationValue(params.data.regionName),
  },
  {
    field: 'locationName',
    headerName: 'LOCATION',
    minWidth: 140,
    sortable: true,
    valueGetter: (params: { data: WorkCommitmentGrid }) => getCorrectLocationValue(params.data.locationName),
  },
  {
    field: 'skills',
    headerName: 'SKILL',
    minWidth: 140,
    sortable: true,
    valueGetter: (params: { data: WorkCommitmentDetails }) => getCorrectSkillsValue(params.data.skills),
  },
  {
    field: 'minimumWorkExperience',
    headerName: 'MIN WORK EXPERIENCE',
    minWidth: 130,
    sortable: true,
  },
  {
    field: 'availabilityRequirement',
    headerName: 'AVAILABILITY REQUIREMENT',
    minWidth: 130,
    sortable: true,
  },
  {
    field: 'schedulePeriod',
    headerName: 'SCHEDULE PERIOD',
    minWidth: 100,
    sortable: true,
  },
  {
    field: 'criticalOrder',
    headerName: 'CRITICAL ORDER',
    minWidth: 100,
    sortable: true,
  },
  {
    field: 'holiday',
    headerName: 'HOLIDAY',
    minWidth: 100,
    sortable: true,
  },
  {
    field: 'jobCode',
    headerName: 'JOB CODE',
    minWidth: 100,
    sortable: true,
  },
  {
    field: 'comments',
    headerName: 'COMMENT',
    minWidth: 220,
    sortable: true,
  },
];
