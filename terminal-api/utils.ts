import {
  CustomerTerminalStateTypes, TransactionCancelStateTypes, CustomerUidAndDiscount
} from '../types/transaction.ts'
import { ConfigurationSchema } from '../types/config.ts'
import { ILogger } from "./logger.ts";

// const BEARER_TOKEN: string = coffee.get("settings.bearer_token").string();
// const POS_ID: string = coffee.get("settings.pos_id").string();
// const URL: string = coffee.get("settings.base_url").string() +
//   coffee.get("settings.terminal_id").string() + "/";


export function generateIds(): [string, string] {
  return [globalThis.crypto.randomUUID(), globalThis.crypto.randomUUID()];
}

export async function httpRequest(
  endpoint: string,
  method: string,
  body: string | null,
  config: ConfigurationSchema,
  timeout = 120000
): Promise<Response> {
  let response: Response;

  try {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), timeout);
    response = await fetch(`${config.base_url}${config.terminal_id}/${endpoint}`, {
      signal: c.signal,
      method: method,
      headers: {
        "Authorization": `Bearer ${config.bearer_token}`,
        "pos-id": `${config.pos_id}`,
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
  config: ConfigurationSchema,
  logger: ILogger
): Promise<CustomerUidAndDiscount> {
  let discount = "";

  // Call the customers endpoint again on every one of
  // these until the customer object is no longer null
  // Possible status values that will be returned:
  // IDLE | CHECKING_IN | SELECTING_DISCOUNT | AWAITING_PAYMENT | AWAITING_CHECKOUT
  let resp = await httpRequest("customers", "GET", null, config);
  let returned_json = await resp.json();

  if (resp.status == 200) {
    while (returned_json.customer == null) {
      const DEVICE_STATE = returned_json.device.device_state_title;
      logger.log(`Customer Terminal State: ${DEVICE_STATE}`);

      if (
        DEVICE_STATE == CustomerTerminalStateTypes.CHECKING_IN && thenCancel
      ) {
        // Cancel the transaction immediately
        resp = await httpRequest("checkouts/cancel", "POST", null, config);

        if (
          resp.status == 200 &&
          TransactionCancelStateTypes.TRANSACTION_CANCELLED
        ) {
          logger.printOutcome(true, resp);
        } else {
          logger.printOutcome(false, resp);
        }
        return Promise.resolve({ discount: discount, uid: "" });
      }

      resp = await httpRequest("customers", "GET", null, config);
      returned_json = await resp.json();
    }
  } else {
    logger.printOutcome(false, resp);
    return Promise.resolve({ discount: discount, uid: "" });
  }

  resp = await httpRequest("customers", "GET", null, config);
  returned_json = await resp.json();

  while (
    returned_json.device.device_state_title ==
    (CustomerTerminalStateTypes.SELECTING_DISCOUNT ||
      CustomerTerminalStateTypes.CHECKING_IN)
  ) {
    const DEVICE_STATE = returned_json.device.device_state_title;
    logger.log(`Customer Terminal State: ${DEVICE_STATE}`);

    if (
      DEVICE_STATE ==
      (CustomerTerminalStateTypes.AWAITING_CHECKOUT ||
        CustomerTerminalStateTypes.AWAITING_PAYMENT)
    ) {
      break;
    }

    resp = await httpRequest("customers", "GET", null, config);
    returned_json = await resp.json();
  }

  logger.log(`Customer data: ${JSON.stringify(returned_json)}`);

  if (returned_json.customer.discounts.length > 0) {
    discount = returned_json.customer.discounts[0].uid;
  }

  return Promise.resolve({
    discount: discount,
    uid: returned_json.customer.uid,
  });
}
