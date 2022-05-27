import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { WorkflowWithDetails, WorkflowWithDetailsPut } from '@shared/models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {

  constructor(private http: HttpClient) {}

  /**
   * Get all workflows by businessUnitId
   * @param businessUnitId parameter to search by
   * @return workflows
   */
  public getWorkflows(businessUnitId: number | null): Observable<WorkflowWithDetails[]> {
    return this.http.get<WorkflowWithDetails[]>(`/api/Workflows/byBusinessUnit/${businessUnitId}`)
  }

  /**
   * Create or update workflow
   * @param workflow object to save
   * @return Created/Updated workflow
   */
  public saveWorkflow(workflow: WorkflowWithDetails): Observable<WorkflowWithDetails | void> {
    return workflow.id ?
      this.http.put<WorkflowWithDetails | void>(`/api/Workflows`, workflow) :
      this.http.post<WorkflowWithDetails | void>(`/api/Workflows`, workflow);
  }

  /**
   * Update workflow
   * @param workflow object to update
   * @return Updated workflow
   */
  public updateWorkflow(workflow: WorkflowWithDetailsPut): Observable<WorkflowWithDetails | void> {
    return this.http.put<WorkflowWithDetails | void>(`/api/Workflows`, workflow);
  }

  /**
   * Remove workflow by its id
   * @param workflow
   */
  public removeWorkflow(workflow: WorkflowWithDetails): Observable<void> {
    return this.http.delete<void>(`/api/Workflows/${workflow.id}`);
  }
}
