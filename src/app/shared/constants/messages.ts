export const RECORD_ADDED = 'Record has been added';
export const RECORDS_ADDED = 'Records have been added';
export const RECORD_MODIFIED = 'Record has been modified';
export const SETUPS_ACTIVATED = 'Setups were successfully activated';
export const RECORD_SAVED = 'Record has been saved';
export const RECORD_DELETE = 'Record has been deleted';
export const RECORD_CANNOT_BE_DELETED = 'Record cannot be deleted';
export const RECORD_CANNOT_BE_SAVED = 'Record cannot be saved';
export const RECORD_ALREADY_EXISTS = 'Record already exists';
export const RECORD_CANNOT_BE_UPDATED = 'Record cannot be updated';
export const DELETE_RECORD_TEXT = 'Are you sure you want to delete?';
export const DELETE_RECORD_TITLE = 'Delete Record';
export const DELETE_CONFIRM_TEXT = 'Are you sure you want to leave this page without saving?';
export const DELETE_FOLDER_TEXT = 'Are you sure you want to delete folder?';
export const DELETE_FOLDER_TITLE = 'Delete Folder';
export const WARNING_TITLE = 'Warning';
export const ADD_CONFIRM_TEXT =
  'Are you sure you want to add Bill rate for Onboarded Candidate? This may lead to recalculating values and generating new invoice records.';
export const EDIT_CONFIRM_TEXT =
  'Are you sure you want to edit the Bill rate for Onboarded Candidate? This may lead to recalculating values and generating new invoice records.';
export const DELETE_CONFIRM_TITLE = 'Unsaved Progress';
export const ORIENTATION_CHANGE_CONFIRM_TITLE = 'Change Orientation Type';
export const ORIENTATION_CHANGE_TEXT = 'Are you sure you want to provide that change? It will cause moving all records to Historical Data grid. All unfinished Orientation processes will need to be rescheduled.';
export const UNSAVED_TABS_TEXT = 'Are you sure you want to leave this tab without saving?';
export const CANCEL_CONFIRM_TEXT = 'Are you sure you want to cancel? All data will be deleted.';
export const RESEND_EMAIL_TITLE = 'Sending Welcome Email';
export const RESEND_EMAIL_TEXT = 'Are you sure you want to re-send the welcome email?';
export const DATA_OVERRIDE_TITLE = 'Data Override';
export const DATA_OVERRIDE_TEXT = 'Are you sure want to override existing data?';
export const INACTIVE_USER_TITLE = 'Inactivate the User';
export const INACTIVE_USER_TEXT = 'Are you sure to inactivate the User?';
export const AGENCY_ADDED = 'Agency details saved successfully';
export const ORDER_EDITS =
  'The recent changes may affect the data previously defined for this order.' +
  'Please make sure that Credentials and Bill Rates are correct';
export const ORDER_PER_DIEM_EDITS =
  'The recent changes may affect the data previously defined for this order.' +
  'Please make sure that Credentials are correct';
export const CANCEL_REJECTION_REASON = 'Are you sure you want to cancel? All data will be deleted';
export const CANCEL_ORDER_CONFIRM_TEXT = 'Are you sure you want to cancel this order? This order will be deleted';
export const CANCEL_ORDER_CONFIRM_TITLE = 'Cancel Order';
export const SET_READONLY_STATUS = "You don't have permissions for setting this status";
export const IMPORT_CONFIRM_TEXT = 'Only those data that do not contain errors will be imported';
export const IMPORT_CONFIRM_TITLE = 'Import';
export const ORDER_WITHOUT_CREDENTIALS =
  'Added order doesn’t contain the Credentials. Please edit the order to onboard candidates successfully';
export const ORDER_WITHOUT_BILLRATES =
  'Added order doesn’t contain the Bill Rates. Please edit the order to onboard candidates successfully';
export const ORDER_WITHOUT_CRED_BILLRATES =
  'Added order doesn’t contain the Credentials and Bill Rates. Please edit the order to onboard candidates successfully';
export const UNSAVE_CHANGES_TEXT = 'Do you want to save changes?';
export const REQUIRED_PERMISSIONS = 'Separate permission right is required';
export const ERROR_START_LESS_END_DATE = 'Start date should be before end date or less';
export const SHOULD_LOC_DEP_INCLUDE_IRP = 'Should all locations and departments be included in IRP?';
export const JOB_DISTRIBUTION_TITLE = 'Job Distribution';
export const PROCEED_FOR_ALL_AGENCY = 'Order will be distributed to all Agencies. Do you want to proceed?';
export const PROCEED_FOR_TIER_LOGIC = 'Order will be distributed based on Tiering logic. Do you want to proceed?';
export const PLEASE_SELECT_SYSTEM_GROUP_SETUP = 'Please select system for Group setup';
export const ORDER_DISTRIBUTED_TO_ALL = 'Order was distributed to all associated Agencies';
export const ERROR_CAN_NOT_REVOKED = 'Order cannot be revoked due to filled position by VMS Candidate';
export const CONFIRM_REVOKE_ORDER =
  'Candidates are in application process. If Order is revoked from VMS distribution then all Candidates will be Rejected. Do you want to proceed?';

export const updateCandidateJobMessage = (dates: string[]) =>
  `For this candidate job timesheets will be recalculated for the next start dates: ${dates.join(', ')}`;
export const usedByOrderErrorMessage = (val: string, entities: string) =>
  `${val} cannot be deleted. This ${val} was used in ${entities}.`;
export const usedInMappingMessage = (mappingName: string) =>
  `This change has been affected ${mappingName} Mapping, please update it on the ${mappingName} Mapping tab`;
export const DEPLOYED_CANDIDATE = 'Deployed Candidate';
export const deployedCandidateMessage = (orderIds: string[]) =>
  `<span class="deployed-candidate__message">Candidate is already working on order <span class="deployed-candidate__order-id"> ${orderIds.join(
    ', '
  )}</span>. Do you wish to proceed?</span>`;
export const CHANGES_SAVED = 'Changes have been saved';
export const SEND_EMAIL = 'Sent email';
export const SEND_EMAIL_REQUIRED = 'Required';
export const DOCUMENT_UPLOAD_SUCCESS = 'Document uploaded successfully';
export const DOCUMENT_UPLOAD_EDIT = 'Document modified successfully';
export const DOCUMENT_SHARED_SUCCESS = 'Documents shared successfully';
export const DOCUMENT_DELETE_SUCCESS = 'Documents deleted successfully';
export const DOCUMENT_UNSHARED_SUCCESS = 'Documents UnShared successfully';
export const FOLDER_DELETE_SUCCESS = 'Folder deleted successfully';
export const EMAIL_RESEND_SUCCESS = 'Email was sent successfully';
export const END_DATE_REQUIRED ='End Date is required.';
export const CANDIDATE_STATUS= 'Selected Candidate status is unavailable';
export const CandidateSSNRequired = 'SSN of Candidate is mandatory to submit candidate application. Once SSN is updated on Candidate Profile screen and come back here to apply.';
export const CandidateDOBRequired= 'DOB of Candidate is mandatory to accept the offer. Please update DOB of candidate on Candidate Profile screen and come back here to accept offer.';
export const CandidatePHONE1Required = (place:any) => 'Phone 1 of the Candidate is mandatory to '+place+' the position.';
export const CandidateADDRESSRequired = (place:any) => 'Address 1, Country, State, City and Zipcode of the Candidate in the Candidate profile are mandatory to '+place+' the position.';
export const TravelerContracttoPermOrdersSucceedMessage = 'The Traveler/Cont. to Perm orders with all positions offered and above status will not be updated. Per- Diem/Closed orders will not be updated.';
export const PerDiemReOrdersErrorMessage = 'Bill Rate cannot be updated for Open Per Diems and Re-Orders.';
export const UpdateRegularRatesucceedcount = (count: number) =>
  ` ${count} Order(s) updated , ` + TravelerContracttoPermOrdersSucceedMessage;

export const DOCUMENT_DOWNLOAD_SUCCESS = 'Document downloaded successfully';
export const SubmissionsLimitReached = 'The order has reached its submission limit';
export const EDIT_MULTIPLE_RECORDS_TEXT = 'Are you sure you want to edit multiple records? It may affect existing schedules and orders.';
export const EDIT_ASSIGNED_DEPARTMENTS_DATES_TEXT = 'Do you want to change those dates? It may affect existing schedules and orders.';
export const ORIENTED_SHIFT_CHANGE_CONFIRM_TEXT = 'Provided changes may have impact on changing Orientation Date, it won’t be automatically updated.';
export const DELETE_MULTIPLE_RECORDS_TEXT = 'Are you sure you want to delete multiple records?';
export const BLOCK_RECORD_TEXT = 'Are you sure you want to block?';
export const BLOCK_RECORD_TITLE = 'Block Record';
export const BLOCK_RECORD_SUCCESS = 'Record Blocked';
export const CANDIDATE_BLOCK='Candidate Blocked';
export const CANDIDATE_UNBLOCK='Candidate Unblocked';
export const ASSIGN_HOME_COST_CENTER = 'Home Cost Center is already assigned, are you sure you want to reassign this department as Home Cost Center?';
export const USER_SUBSCRIPTION_PERMISSION = 'User missing required permissions(CanViewSubscriptions)';
export const USER_ALERTS_PERMISSION = 'User missing required permissions(CanViewTemplates)';
export const MULTI_CLOSE_ORDER = 'Order will be closed in VMS and IRP. Are you sure you want to proceed?';
export const CLOSE_ORDER_TITLE = 'Close order';
export const CLOSE_IRP_POSITION = 'Closing position will permanently close it without the ability to reverse the action.';
export const ALL_DEPARTMENTS_SELECTED = 'You can`t assign Departments manually when "All" is selected';
export const NO_ACTIVE_WORK_COMMITMET = 'No active Work Commitment';
export const REASON_WARNING = 'Please select a System for Reason';
export const EMPLOYEE_SKILL_CHANGE_WARNING = 'Do you want to update Employee Skills? It may have impact on Schedule and Orders.';
export const IRP_DEPARTMENT_CHANGE_WARNING = 'Do you want to provide that change? It may cause deleting future schedules and canceling Employee from orders.';
export const EMPLOYEE_TERMINATED_WARNING = 'Do you want to terminate the employee?';
export const addAvailabilityToStart = 'Add Availability to start Scheduling';

export const RECORD_SAVED_SUCCESS = 'Record saved successfully';
export const INACTIVEDATE = 'Location will be inactivated at '
export const INACTIVEDATE_DEPARTMENT = 'Department will be inactivated at '
export const INACTIVE_MESSAGE = '. Are you sure you want to proceed?'
export const UpdateClosedPositionRate = 'Are you sure you want to update the Bill rate '
+ 'for Closed Position? This may lead to recalculating values and generating new invoice records.';
export const HaveScheduleBooking =
  'Onboarded Candidate(s) have scheduled Bookings for this LTA Order. Do you like to remove or update them?';

export const N_FAILED_RECORDS = (count: number) => `${count} failed to process.`;
export const N_SUCCESS_RECORDS = (count: number) => `${count} records successfully processed.`;
export const ExtensionStartDateValidation = 'Extension may not be created with more than a 14 day gap from initial order to extension order.';
