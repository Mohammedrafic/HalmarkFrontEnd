import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MspListDto } from "../constant/msp.constant";
import { Observable } from "rxjs";
import { MSP, MspListPage } from "../store/model/msp.model";

@Injectable({ providedIn: 'root' })
export class MspService {
  constructor(private http: HttpClient) { }

  public GetMspList(): Observable<MspListPage> {       
    let params = new HttpParams();    
    params = params.append("ShowAllPages", true);    
    return this.http.get<MspListPage>(`/api/msp/filtered`, { params: params });
  }

    /**
   * Create or update organization
   * @param msp object to save
   * @return Created/Updated organization
   */
    public saveOrganization(msp: MSP): Observable<MSP> {
      return this.http.post<MSP>(`/api/MSP`, msp);
    }
}