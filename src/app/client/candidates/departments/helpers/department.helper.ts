import { DateTimeHelper } from '@core/helpers';
import { DepartmentFilterState, DepartmentPayload } from '../departments.model';

export class DepartmentHelper {
  static editDepartmentPayload(
    formData: DepartmentPayload,
    departmentIds: number[] | null,
    employeeWorkCommitmentId: number,
    employeeId: number,
    toggleAllOn: boolean,
    filters?: DepartmentFilterState | null,
    createReplacement?: boolean,
  ): DepartmentPayload {
    return {
      ...createDepartmentPayload(formData),
      ...(filters ?? {}),
      ids: departmentIds,
      employeeId: employeeId,
      employeeWorkCommitmentId: toggleAllOn ? null : employeeWorkCommitmentId,
      createReplacement,
    };
  }

  static newDepartmentPayload(formData: DepartmentPayload, employeeWorkCommitmentId: number): DepartmentPayload {
    return {
      ...createDepartmentPayload(formData),
      employeeWorkCommitmentId: employeeWorkCommitmentId,
    };
  }

  static findSelectedItems(values: number[], structureData: unknown[]): unknown[] {
    return values.map((id: number) => (structureData as { id: number }[]).find((item) => item.id === id));
  }
}

function createDepartmentPayload(formData: DepartmentPayload): DepartmentPayload {
  const {
    departmentIds,
    locationIds,
    regionIds,
    startDate,
    endDate,
    isOriented,
    isHomeCostCenter,
    orientationDate,
  } = formData;

  return {
    forceUpdate: false,
    isOriented: !!isOriented,
    startDate: startDate && DateTimeHelper.setInitHours(DateTimeHelper.setUtcTimeZone(startDate)),
    endDate: endDate && DateTimeHelper.setInitHours(DateTimeHelper.setUtcTimeZone(endDate)),
    orientationDate: orientationDate && DateTimeHelper.setInitHours(DateTimeHelper.setUtcTimeZone(orientationDate)),
    ...(departmentIds && { departmentIds, locationIds, regionIds }),
    ...(isHomeCostCenter && { isHomeCostCenter }),
  };
}

export function departmentName(name: string, id: string): string {
  return `${name} (${id})`;
}
