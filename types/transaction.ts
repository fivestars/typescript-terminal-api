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
  other = "OTHER",
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
