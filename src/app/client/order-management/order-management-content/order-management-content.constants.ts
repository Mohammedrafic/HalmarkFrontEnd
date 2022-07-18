import { ExportColumn } from '@shared/models/export.model';

export const ROW_HEIGHT = {
  SCALE_UP_HEIGHT: 140,
  SCALE_DOWN_HEIGHT: 64
}

export enum MoreMenuType {
  'Edit',
  'Duplicate',
  'Close',
  'Delete'
}

export enum OrderTypeName {
  ContractToPerm = 'ContractToPerm',
  OpenPerDiem = 'OpenPerDiem',
  PermPlacement = 'PermPlacement',
  Traveler = 'Traveler'
}

export const allOrdersColumnsToExport: ExportColumn[] = [
  { text:'Order ID', column: 'Id'},
  { text:'Status', column: 'StatusText'},
  { text:'Job Title', column: 'JobTitle'},
  { text:'Skill', column: 'SkillName'},
  { text:'# of Positions', column: 'OpenPositions'},
  { text:'Location', column: 'LocationName'},
  { text:'Department', column: 'DepartmentName'},
  { text:'Type', column: 'OrderType'},
  { text:'Bill Rate', column: 'BillRate'},
  { text:'Candidates', column: 'Candidates'},
  { text:'Start Date', column: 'StartDate'},
];

export const perDiemColumnsToExport: ExportColumn[] = [
  { text:'Order ID', column: 'Id'},
  { text:'Status', column: 'StatusText'},
  { text:'Job Title', column: 'JobTitle'},
  { text:'Skill', column: 'SkillName'},
  { text:'Location', column: 'LocationName'},
  { text:'Department', column: 'DepartmentName'},
  { text:'Candidates', column: 'Candidates'},
  { text:'# of Shifts Next 90 Days', column: 'NumberOfShiftsNext90Days'},
];

export const reOrdersColumnsToExport: ExportColumn[] = [
  { text:'Re-Order ID', column: 'ReOrderId'},
  { text:'Status', column: 'Status'},
  { text:'Job Title', column: 'JobTitle'},
  { text:'Skill', column: 'Skill'},
  { text:'# of Positions', column: 'CountOfPosition' },
  { text:'Location', column: 'Location'},
  { text:'Department', column: 'Department'},
  { text:'Candidates', column: 'Candidates'},
  { text:'Bill Rate', column: 'BillRate'},
  { text:'Re-Order Date', column: 'ReOrderDate'},
  { text:'Shift', column: 'Shift'},
  { text:'Agency', column: 'Agency'},
];

export const reOrdersChildColumnToExport: ExportColumn[] = [
  { text: 'Position ID', column: 'PositionID'},
  { text: 'Position Status', column: 'PositionStatus'},
  { text: 'Candidate Name', column: 'CandidateName'},
  { text: 'Candidate Status', column: 'CandidateStatus'},
  { text: 'Submission', column: 'Submission'},
  { text: 'Onboarded', column: 'Onboarded'},
]

export const ReOrdersColumnsConfig = [
  {
    fieldName: 'reOrderFromId',
    visible: true
  },
  {
    fieldName: 'jobStartDate',
    visible: true
  },
  {
    fieldName: 'shift',
    visible: true
  },
  {
    fieldName: 'agencies',
    visible: true
  },
  {
    fieldName: 'id',
    visible: false
  },
  {
    fieldName: 'orderType',
    visible: false
  },
  {
    fieldName: 'startDate',
    visible: false
  },
  {
    fieldName: 'shiftsNext90Days',
    visible: false
  },
];

export const AllOrdersColumnsConfig = [
  {
    fieldName: 'id',
    visible: true
  },
  {
    fieldName: 'orderType',
    visible: true
  },
  {
    fieldName: 'startDate',
    visible: true
  },
  {
    fieldName: 'reOrderFromId',
    visible: false
  },
  {
    fieldName: 'jobStartDate',
    visible: false
  },
  {
    fieldName: 'shift',
    visible: false
  },
  {
    fieldName: 'agencies',
    visible: false
  },
  {
    fieldName: 'shiftsNext90Days',
    visible: false
  },
];

export const PerDiemColumnsConfig = [
  {
    fieldName: 'id',
    visible: true
  },
  {
    fieldName: 'orderType',
    visible: false
  },
  {
    fieldName: 'startDate',
    visible: false
  },
  {
    fieldName: 'reOrderFromId',
    visible: false
  },
  {
    fieldName: 'jobStartDate',
    visible: false
  },
  {
    fieldName: 'shift',
    visible: false
  },
  {
    fieldName: 'agencies',
    visible: false
  },
  {
    fieldName: 'openPositions',
    visible: false
  },
  {
    fieldName: 'billRate',
    visible: false
  },
  {
    fieldName: 'shiftsNext90Days',
    visible: true
  },
];
