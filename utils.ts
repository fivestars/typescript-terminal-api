import coffee from "https://deno.land/x/coffee@1.0.0/mod.ts";
import {
  bold,
  gray,
  green,
  red,
} from "https://deno.land/std@0.123.0/fmt/colors.ts";

const BEARER_TOKEN: string = coffee.get("settings.bearer_token").string();
const POS_ID: string = coffee.get("settings.pos_id").string();
const URL: string = coffee.get("settings.base_url").string() +
  coffee.get("settings.terminal_id").string() + "/";

export const log = console.log;

export enum CustomerTerminalStateTypes {
  IDLE = "IDLE",
  CHECKING_IN = "CHECKING_IN",
  SELECTING_DISCOUNT = "SELECTING_DISCOUNT",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  AWAITING_CHECKOUT = "AWAITING_CHECKOUT",
}

export enum transactionTypes {
  cash = "CASH",
  credit = "CREDIT",
  other = "OTHER",
}

export enum TransactionCancelStateTypes {
  TRANSACTION_CANCELLED = "TRANSACTION_CANCELLED",
  UNABLE_TO_CANCEL_TRANSACTION = "UNABLE_TO_CANCEL_TRANSACTION",
}

export interface customerUidAndDiscount {
  uid: string;
  discount: string;
}

export enum TransactionStatusTypes {
  CUSTOMER_OR_DISCOUNT_MISMATCH = "CUSTOMER_OR_DISCOUNT_MISMATCH",
  TRANSACTION_STARTED = "TRANSACTION_STARTED",
  PRIOR_TRANSACTION_ALREADY_IN_PROGRESS =
    "PRIOR_TRANSACTION_ALREADY_IN_PROGRESS",
  DUPLICATE_POS_CHECKOUT_ID = "DUPLICATE_POS_CHECKOUT_ID",
  TRANSACTION_PRECONDITIONS_NOT_MET = "TRANSACTION_PRECONDITIONS_NOT_MET",
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  CANCELED_BY_POS = "CANCELED_BY_POS",
  CANCELED_BY_CUSTOMER = "CANCELED_BY_CUSTOMER",
  TRANSACTION_CANCELED = "TRANSACTION_CANCELED",
}

export function printOutcome(
  successful = false,
  reponse: Response,
) {
  log(gray("--------------------------------------"));
  log(
    successful
      ? bold(green("Flow Outcome: Success"))
      : bold(red("Flow Outcome: Failed")),
  );
  log(`Status Code: ${reponse.status}`);
  log(gray("--------------------------------------"));
}

export function generateIds(): [string, string] {
  return [globalThis.crypto.randomUUID(), globalThis.crypto.randomUUID()];
}

export async function httpRequest(
  endpoint: string,
  method: string,
  body: string | null,
  timeout = 120000,
): Promise<Response> {
  let response: Response;

  try {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), timeout);
    response = await fetch(URL + endpoint, {
      signal: c.signal,
      method: method,
      headers: {
        "Authorization": `Bearer ${BEARER_TOKEN}`,
        "pos-id": `${POS_ID}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      response = new Response(null, { status: 408 });
    } else {
      // response = new Response(null, { status: 503 });
      throw err;
    }
  }
  return response;
}

export async function getCustomers(
  thenCancel = false,
): Promise<customerUidAndDiscount> {
  let discount = "";

  // Call the customers endpoint again on every one of
  // these until the customer object is no longer null
  // Possible status values that will be returned:
  // IDLE | CHECKING_IN | SELECTING_DISCOUNT | AWAITING_PAYMENT | AWAITING_CHECKOUT
  let resp = await httpRequest("customers", "GET", null);
  let returned_json = await resp.json();

  if (resp.status == 200) {
    while (returned_json.customer == null) {
      const DEVICE_STATE = returned_json.device.device_state_title;
      log(`Customer Terminal State: ${DEVICE_STATE}`);

      if (
        DEVICE_STATE == CustomerTerminalStateTypes.CHECKING_IN && thenCancel
      ) {
        // Cancel the transaction immediately
        resp = await httpRequest("checkouts/cancel", "POST", null);

        if (
          resp.status == 200 &&
          TransactionCancelStateTypes.TRANSACTION_CANCELLED
        ) {
          printOutcome(true, resp);
        } else {
          printOutcome(false, resp);
        }
        return Promise.resolve({ discount: discount, uid: "" });
      }

      resp = await httpRequest("customers", "GET", null);
      returned_json = await resp.json();
    }
  } else {
    printOutcome(false, resp);
    return Promise.resolve({ discount: discount, uid: "" });
  }

  resp = await httpRequest("customers", "GET", null);
  returned_json = await resp.json();

  while (
    returned_json.device.device_state_title ==
      (CustomerTerminalStateTypes.SELECTING_DISCOUNT ||
        CustomerTerminalStateTypes.CHECKING_IN)
  ) {
    const DEVICE_STATE = returned_json.device.device_state_title;
    log(`Customer Terminal State: ${DEVICE_STATE}`);

    if (
      DEVICE_STATE ==
        (CustomerTerminalStateTypes.AWAITING_CHECKOUT ||
          CustomerTerminalStateTypes.AWAITING_PAYMENT)
    ) {
      break;
    }

    resp = await httpRequest("customers", "GET", null);
    returned_json = await resp.json();
  }

  log(`Customer data: ${JSON.stringify(returned_json)}`);

  if (returned_json.customer.discounts.length > 0) {
    discount = returned_json.customer.discounts[0].uid;
  }

  return Promise.resolve({
    discount: discount,
    uid: returned_json.customer.uid,
  });
}
