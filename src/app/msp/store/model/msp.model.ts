import { PageOfCollections } from "@shared/models/page.model";
import { MspListDto } from "../../constant/msp.constant";
import { OrganizationStatus } from "@shared/enums/status";

export type MspListPage = PageOfCollections<MspListDto>;

export class MSP {
    mspDetails: GeneralInformation;
    mspBillingDetails: BillingDetails;
    mspContactDetails: ContactDetails[];
  
    constructor(
      mspDetails: GeneralInformation,
      mspBillingDetails: BillingDetails,
      mspContactDetails: ContactDetails[],
    ) {
      this.mspDetails = mspDetails;
      if (this.mspDetails.externalId === '') {
        this.mspDetails.externalId = null;
      }
      this.mspBillingDetails = mspBillingDetails;
      this.mspContactDetails = mspContactDetails;
    }
  }

  
export class GeneralInformation {
    id?: number;
    organizationId?: number;
    externalId?: number | string | null;
    taxId: string;
    name: string;
    organizationType: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    country: number;
    city: string;
    zipCode: string;
    phone1Ext: string;
    phone2Ext: string;
    fax: string;
    website: string;
    status: OrganizationStatus;
    organizationPrefix: string;
  }
  
  export class BillingDetails {
    id?: number;
    organizationId: number;
    adminUserId: number;
    sameAsOrganization: boolean;
    name: string;
    address: string;
    country: number;
    state: string;
    city: string;
    zipCode: string;
    phone1: string;
    phone2: string;
    ext: string;
    fax: string;
  }
  
  export class ContactDetails {
    id?: number;
    organizationId?: number;
    title: string;
    contactPerson: string;
    email: string;
    phoneNumberExt: string;
  }
  