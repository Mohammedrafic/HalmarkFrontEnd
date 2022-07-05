import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { PageOfCollections } from "@shared/models/page.model";
import { GetInvoicesData, InvoiceRecord } from "../interfaces";
import { BaseObservable } from '@core/helpers';

const mockedRecords: InvoiceRecord[] = generateInvoiceRecords(100);

@Injectable()
export class InvoicesService {
  private currentSelectedTableRowIndex: BaseObservable<number> = new BaseObservable<number>(null as any);

  constructor(
    private http: HttpClient,
  ) {
  }

  public getInvoices({pageSize, page}: GetInvoicesData): Observable<PageOfCollections<InvoiceRecord>> {
    const totalPages = Math.ceil(100 / pageSize);
    const currentPage = page;
    const start: number = (page - 1) * pageSize;
    const end: number = page * pageSize;

    return of({
      items: mockedRecords,
      totalCount: 100,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      pageNumber: page,
      totalPages: totalPages,
    } as PageOfCollections<InvoiceRecord>);
  }

  public getCurrentTableIdxStream(): Observable<number> {
    return this.currentSelectedTableRowIndex.getStream();
  }

  public setNextValue(next: boolean): void {
    this.currentSelectedTableRowIndex.set(next ?
      this.currentSelectedTableRowIndex.get() + 1 :
      this.currentSelectedTableRowIndex.get() - 1);
  }

  public setCurrentSelectedIndexValue(value: number): void {
    this.currentSelectedTableRowIndex.set(value);
  }

  public getNextIndex(): number {
    return this.currentSelectedTableRowIndex.get();
  }
}

function generateInvoiceRecords(amount: number = 100): InvoiceRecord[] {
  return Array.from(Array(amount)).map<InvoiceRecord>((_, index: number) => {
    return {
      weekPeriod: '4 - WE 02/13/2022',
      organization: `Org${index + 1}`,
      location: 'Thone - Johnson Memorial Hospital',
      department: 'Emergency Department',
      candidate: 'Adkins, Adele Blue',
      jobTitle: 'Job Title',
      skill: 'TestSkill',
      amount: 1400,
      startDate: '02/02/2022',
      hours: getRandomNumberInRange(20, 40),
      bonus: 0,
      rate: getRandomNumberInRange(36, 1400),
      timesheetId: 11,
    }
  });
}

function getRandomNumberInRange(start: number, end: number): number {
  return Math.floor(Math.random() * end) + start;
}
