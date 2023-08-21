export enum CustomerTerminalStateTypes {
  IDLE = "IDLE",
  CHECKING_IN = "CHECKING_IN",
  SELECTING_DISCOUNT = "SELECTING_DISCOUNT",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  AWAITING_CHECKOUT = "AWAITING_CHECKOUT",
}

export enum TransactionTypes {
  cash = "CASH",
  credit = "CREDIT",
  other = "OTHER"
}

export enum TransactionCancelStateTypes {
  TRANSACTION_CANCELLED = "TRANSACTION_CANCELLED",
  UNABLE_TO_CANCEL_TRANSACTION = "UNABLE_TO_CANCEL_TRANSACTION",
}

export interface CustomerUidAndDiscount {
  uid: string;
  discount: string;
}

export enum TransactionStatusTypes {
  CUSTOMER_OR_DISCOUNT_MISMATCH = "CUSTOMER_OR_DISCOUNT_MISMATCH",
  TRANSACTION_STARTED = "TRANSACTION_STARTED",
  PRIOR_TRANSACTION_ALREADY_IN_PROGRESS = "PRIOR_TRANSACTION_ALREADY_IN_PROGRESS",
  DUPLICATE_POS_CHECKOUT_ID = "DUPLICATE_POS_CHECKOUT_ID",
  TRANSACTION_PRECONDITIONS_NOT_MET = "TRANSACTION_PRECONDITIONS_NOT_MET",
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  CANCELED_BY_POS = "CANCELED_BY_POS",
  CANCELED_BY_CUSTOMER = "CANCELED_BY_CUSTOMER",
  TRANSACTION_CANCELED = "TRANSACTION_CANCELED",
}

export const COMPLETED_SUCCESS_TRANSACTION_STATES = [
  TransactionStatusTypes.TRANSACTION_CANCELED,
  TransactionStatusTypes.SUCCESSFUL
]

export const COMPLETED_FAILED_TRANSACTION_STATES = [
  TransactionStatusTypes.CANCELED_BY_CUSTOMER,
  TransactionStatusTypes.CANCELED_BY_POS,
  TransactionStatusTypes.CUSTOMER_OR_DISCOUNT_MISMATCH,
  TransactionStatusTypes.DUPLICATE_POS_CHECKOUT_ID,
  TransactionStatusTypes.PRIOR_TRANSACTION_ALREADY_IN_PROGRESS,
  TransactionStatusTypes.TRANSACTION_PRECONDITIONS_NOT_MET
]

export const COMPLETED_TRANSACTION_STATES = [
  ...COMPLETED_SUCCESS_TRANSACTION_STATES, ...COMPLETED_FAILED_TRANSACTION_STATES
]

export interface PingResponse {
  connected: boolean
}

// Generated by https://quicktype.io

export interface CustomerInformation {
  customer: Customer;
  device: Device;
}

export interface Customer {
  birthday: string;
  created_at: number;
  email: string;
  is_mobile_user: boolean;
  is_web_registered: boolean;
  last_visited_at: number;
  membership_status: string;
  most_recent_transaction: null;
  name: string;
  notes: string;
  notifications: Notifications;
  num_times_checked_in_cts: number;
  phone: string;
  picture_url: string;
  points: number;
  total_points: number;
  uid: string;
  universal_status: UniversalStatus;
  vip_level: string;
  visit_count: number;
  discounts: Discount[];
}

export interface Discount {
  partner_metadata: any;
  name: string;
  pointCost: number;
  selected: boolean;
  type: string;
  uid: string;
}

export interface Notifications {
  promotions: any[];
}

export interface UniversalStatus {
}

export interface Device {
  device_state_title: CustomerTerminalStateTypes;
  force_pos_modal: boolean;
  modal_buttons: any[];
  modal_text: null;
}

export interface CreateTransactionResponse {
  pos_checkout_id: string;
  pos_checkout_id_in_progress: string;
  status: TransactionStatusTypes;
}

export interface TransactionStatusResponse {
  amount: number;
  card_uid?: string;
  checkout_reference: string;
  currency: string;
  status: TransactionStatusTypes;
  tip: number;
}

