import {
  FiltersApplicability,
  WorkflowFilters,
  WorkflowFlags,
  WorkflowWithDetails,
} from '@shared/models/workflow.model';
import { WorkflowMappingGet, WorkflowMappingPage } from '@shared/models/workflow-mapping.model';
import { WorkflowGroupType } from '@shared/enums/workflow-group-type';
import { WorkflowTabNames } from '@organization-management/workflow/workflow-mapping/constants';
import { Applicability } from '@organization-management/workflow/enumns';

export const GetSelectedCardIndex = (workflowDetails: WorkflowWithDetails[], cardId: number): number => {
  return workflowDetails.findIndex((workflows: WorkflowWithDetails) => {
    return workflows.id === cardId;
  });
};

export const GetWorkflowFlags = (isIRP: boolean): WorkflowFlags => {
  return {
    includeInVMS: !isIRP,
    includeInIRP: isIRP,
  };
};

export const PrepareCardInfo = (workflows: WorkflowWithDetails[]):WorkflowWithDetails[] => {
  return workflows.map((workflow: WorkflowWithDetails) => {
    return {
      ...workflow,
      cardInfo: GetCardInfo(workflow.initialOrders, workflow.extensions),
    };
  });
};

export const GetCardInfo = (initialOrders = false, extensions = false): string => {
  if (initialOrders && extensions) {
    return 'Initial Order & Extension';
  }

  if (initialOrders) {
    return 'Initial Order';
  }

  if (extensions) {
    return 'Extension';
  }

  return '';
};

export const PrepareWorkflowMapping = (mapping: WorkflowMappingPage): WorkflowMappingPage => {
  return {
    ...mapping,
    items: mapping.items.map((item: WorkflowMappingGet) => {
      const workflowGroupName = item.workflowGroupType === WorkflowGroupType.IRPOrderWorkflow ?
        WorkflowTabNames.irpWorkflow : WorkflowTabNames.vmsWorkflow;
      return {
        ...item,
        workflowApp: GetCardInfo(item?.initialOrders, item?.extensions),
        workflowGroupName,
      };
    }),
  };
};

export const UpdateFiltersApplicability = (filters: WorkflowFilters): WorkflowFilters => {
  if(filters.workflowApplicability?.length) {
    const applicabilityDetails = filters.workflowApplicability.reduce((acc: FiltersApplicability,value: string) => {
     if(value === Applicability.Order) {
       acc.initialOrders = true;
     }
     if(value === Applicability.Extension) {
       acc.extensions = true;
     }
    return acc;
    }, {
      initialOrders: false,
      extensions: false,
    });

    return {
      ...filters,
      applicability: applicabilityDetails,
    };
  }

  filters.applicability = {
    initialOrders: false,
    extensions: false,
  };
  return filters;
};

