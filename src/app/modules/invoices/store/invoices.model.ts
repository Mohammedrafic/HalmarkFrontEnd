import { PageOfCollections } from "@shared/models/page.model";
import { InvoiceRecord } from "../interfaces";

export interface InvoicesModel {
  invoicesData: PageOfCollections<InvoiceRecord>;
  isInvoiceDetailDialogOpen: boolean;
  selectedInvoiceId: number;
  prevInvoiceId?: string;
  nextInvoiceId?: string;
}
