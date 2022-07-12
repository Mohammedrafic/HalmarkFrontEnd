import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AcceptJobDTO,
  AgencyOrderFilters,
  AgencyOrderManagementPage,
  ApplicantStatus,
  CreateOrderDto,
  EditOrderDto,
  Order,
  OrderCandidateJob,
  OrderCandidatesListPage,
  OrderFilterDataSource,
  OrderManagementFilter,
  OrderManagementPage,
  SuggestedDetails,
} from '@shared/models/order-management.model';
import { OrganizationStateWithKeyCode } from '@shared/models/organization-state-with-key-code.model';
import { WorkflowByDepartmentAndSkill } from '@shared/models/workflow-mapping.model';
import { AssociateAgency } from '@shared/models/associate-agency.model';
import { OrderType } from '@shared/enums/order-type';
import { BillRate } from '@shared/models/bill-rate.model';
import { RejectReasonPayload } from '@shared/models/reject-reason.model';
import { HistoricalEvent } from '../models/historical-event.model';
import { ExportPayload } from '@shared/models/export.model';
import { OrganizationOrderManagementTabs } from '@shared/enums/order-management-tabs.enum';

@Injectable({ providedIn: 'root' })
export class OrderManagementContentService {
  constructor(private http: HttpClient) {}

  /**
   * Get the incomplete order
   @param payload filter with details we need to get
   */
  public getIncompleteOrders(payload: OrderManagementFilter | object): Observable<OrderManagementPage> {
    return this.http.post<OrderManagementPage>(`/api/Orders/Incomplete`, payload);
  }

  /**
   * Get the orders
   @param payload filter with details we need to get
   */
  public getOrders(payload: OrderManagementFilter | object): Observable<OrderManagementPage> {
    return this.http.post<OrderManagementPage>(`/api/Orders/all`, payload);
  }

  /**
   * Get the re-orders
   @param payload filter with details we need to get
   */
  public getReOrders(payload: OrderManagementFilter | object): Observable<OrderManagementPage> {
    return this.http.post<OrderManagementPage>(`/api/Orders/ReOrders`, payload); // TODO: modification pending after BE implementation
  }

  /**
   * Get the agency orders
   @param pageNumber
   @param pageSize
   */
  public getAgencyOrders(
    pageNumber: number,
    pageSize: number,
    filters: AgencyOrderFilters
  ): Observable<AgencyOrderManagementPage> {
    return this.http.post<AgencyOrderManagementPage>(`/api/Agency/Orders`, { pageNumber, pageSize, ...filters });
  }

  /**
   * Get the agency re-orders
   @param pageNumber
   @param pageSize
   @param filters
   */
  public getAgencyReOrders(
    pageNumber: number,
    pageSize: number,
    filters: AgencyOrderFilters
  ): Observable<AgencyOrderManagementPage> {
    return this.http.post<AgencyOrderManagementPage>(`/api/Agency/ReOrders`, { pageNumber, pageSize, ...filters }); // TODO: modification pending after BE implementation
  }

  /**
   * Get the agency order candidates
   @param orderId
   @param organizationId
   @param pageNumber
   @param pageSize
   */
  public getAgencyOrderCandidatesList(
    orderId: number,
    organizationId: number,
    pageNumber: number,
    pageSize: number,
    includeDeployed?: boolean
  ): Observable<OrderCandidatesListPage> {
    let params: any = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    if (includeDeployed) {
      params = { ...params, includeDeployed };
    }
    return this.http.get<OrderCandidatesListPage>(
      `/api/CandidateProfile/order/${orderId}/organization/${organizationId}`,
      { params }
    );
  }

  /**
   * Get the agency orders information
   @param id
   @param organizationId
   */
  public getAgencyOrderGeneralInformation(id: number, organizationId: number): Observable<Order> {
    return this.http.get<Order>(`/api/Orders/${id}/organization/${organizationId}`);
  }

  /**
   * Get order by id
   @param id
   */
  public getAgencyOrderById(id: number, organizationId: number): Observable<Order> {
    return this.http.get<Order>(`/api/Orders/${id}/organization/${organizationId}`);
  }

  /**
   * Get candidate job
   @param organizationId
   @param jobId
   */
  public getCandidateJob(organizationId: number, jobId: number): Observable<OrderCandidateJob> {
    return this.http.get<OrderCandidateJob>(
      `/api/AppliedCandidates/candidateJob?OrganizationId=${organizationId}&JobId=${jobId}`
    );
  }

  /**
   * Update candidate job
   @param payload
   */
  public updateCandidateJob(payload: AcceptJobDTO): Observable<void> {
    return this.http.post<void>(`/api/AppliedCandidates/updateCandidateJob`, payload);
  }

  /**
   * Get available steps
   @param organizationId
   @param jobId
   */
  public getAvailableSteps(organizationId: number, jobId: number): Observable<ApplicantStatus[]> {
    return this.http.get<ApplicantStatus[]>(
      `/api/AppliedCandidates/availableSteps?OrganizationId=${organizationId}&JobId=${jobId}`
    );
  }

  /**
   * Get order by id
   @param id
   */
  public getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`/api/Orders/${id}`);
  }

  /**
   * Get the agency order candidates
   @param orderId
   @param organizationId
   @param pageNumber
   @param pageSize
   */
  public getOrderCandidatesList(
    orderId: number,
    organizationId: number,
    pageNumber: number,
    pageSize: number,
    includeDeployed?: boolean
  ): Observable<OrderCandidatesListPage> {
    let params: any = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    if (includeDeployed) {
      params = { ...params, includeDeployed };
    }
    return this.http.get<OrderCandidatesListPage>(`/api/CandidateProfile/order/${orderId}`, {
      params,
    });
  }

  /**
   * Get the list of states for organization
   * @return Array of states
   */
  public getOrganizationStatesWitKeyCode(): Observable<OrganizationStateWithKeyCode[]> {
    return this.http.get<OrganizationStateWithKeyCode[]>('/api/Organizations/states');
  }

  /**
   * Get the list of workflows by department and skill
   * @param departmentId
   * @param skillId
   * @return Array of workflows
   */
  public getWorkflowsByDepartmentAndSkill(
    departmentId: number,
    skillId: number
  ): Observable<WorkflowByDepartmentAndSkill[]> {
    return this.http.get<WorkflowByDepartmentAndSkill[]>(
      `/api/WorkflowMapping/department/${departmentId}/skill/${skillId}`
    );
  }

  /**
   * Get the list of agencies for organization
   * @return Array of associate agencies
   */
  public getAssociateAgencies(): Observable<AssociateAgency[]> {
    return this.http.get<AssociateAgency[]>('/api/AssociateAgencies');
  }

  /**
   * Get predefined bill rates for order by order type, department id and skill id
   * @param orderType
   * @param departmentId
   * @param skillId
   * @returns list of predefined bill rates
   */
  public getPredefinedBillRates(orderType: OrderType, departmentId: number, skillId: number): Observable<BillRate[]> {
    const params = new HttpParams()
      .append('orderType', orderType)
      .append('departmentId', departmentId)
      .append('skillId', skillId);

    return this.http.get<BillRate[]>('/api/BillRates/predefined/forOrder', { params });
  }

  /**
   * Get workLocation and contactDetails based on location
   * @param locationId
   * @returns suggessted details data
   */
  public getSuggestedDetails(locationId: number | string): Observable<SuggestedDetails> {
    return this.http.get<SuggestedDetails>(`/api/Orders/suggestedDetails/${locationId}`);
  }

  /**
   * Create order
   * @param order object to save
   * @param documents array of attached documents
   * @return saved order
   */
  public saveOrder(order: CreateOrderDto, documents: Blob[]): Observable<Order> {
    return this.http.post<Order>('/api/Orders', order).pipe(
      switchMap((createdOrder) => {
        const formData = new FormData();
        documents.forEach((document) => formData.append('documents', document));
        return this.http.post(`/api/Orders/${createdOrder.id}/documents`, formData).pipe(map(() => createdOrder));
      })
    );
  }

  /**
   * Edit order
   * @param order object to edit
   * @return edited order
   */
  public editOrder(order: EditOrderDto, documents: Blob[]): Observable<Order> {
    return this.http.put<Order>('/api/Orders', order).pipe(
      switchMap((editedOrder) => {
        const formData = new FormData();
        documents.forEach((document) => formData.append('documents', document));
        return this.http.post(`/api/Orders/${editedOrder.id}/documents`, formData).pipe(map(() => editedOrder));
      })
    );
  }

  /**
   * Delete order
   * @param id order id to delete
   */
  public deleteOrder(id: number): Observable<any> {
    return this.http.delete<Order>('/api/Orders', { params: { orderId: id } });
  }

  /**
   * Approve order
   * @param id order id to approve
   */
  public approveOrder(id: number): Observable<string> {
    return this.http.post(`/api/Order/approve`, { orderId: id }, { responseType: 'text' });
  }

  /**
   * Reject Candidate Job
   * @param payload
   */
  public rejectCandidateJob(payload: RejectReasonPayload): Observable<void> {
    return this.http.post<void>('/api/AppliedCandidates/rejectCandidateJob', payload);
  }

  /**
   * Get order filter data sources
   */
  public getOrderFilterDataSources(): Observable<OrderFilterDataSource> {
    return this.http.get<OrderFilterDataSource>('/api/OrdersFilteringOptions/organization');
  }

  /**
   * Get the historical data for candidate
   * @return Array of historical events
   */
  public getHistoricalData(organizationId: number, jobId: number): Observable<HistoricalEvent[]> {
    return this.http.get<HistoricalEvent[]>(
      `/api/AppliedCandidates/historicalData?OrganizationId=${organizationId}&CandidateJobId=${jobId}`
    );
  }

  /**
   * Export organization list
   */
  public export(payload: ExportPayload, tab: OrganizationOrderManagementTabs): Observable<any> {
    if (tab === OrganizationOrderManagementTabs.PerDiem) {
      return this.http.post(`/api/Orders/perdiem/export`, payload, { responseType: 'blob' });
    }
    return this.http.post(`/api/Orders/export`, payload, { responseType: 'blob' });
  }
}

