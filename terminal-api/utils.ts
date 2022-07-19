import { ConfigurationSchema } from '../types/config.ts';
import {
  CustomerTerminalStateTypes, CustomerUidAndDiscount, TransactionCancelStateTypes
} from '../types/transaction.ts';
import { UnpackedResponse } from '../types/utils.ts';
import { ILogger } from "./logger.ts";


export function generateIds(): [string, string] {
  return [globalThis.crypto.randomUUID(), globalThis.crypto.randomUUID()];
}

async function unpackResponse(response: Response): Promise<UnpackedResponse> {
  return [
    response,
    response.ok ? await response.json() : undefined
  ];
}

export async function httpRequest(
  endpoint: string,
  method: string,
  body: string | null,
  config: ConfigurationSchema,
  logger: ILogger,
  delayInMillis: number,
  timeout = 120000
): Promise<UnpackedResponse> {
  let response: UnpackedResponse;

  try {
    if (delayInMillis > 0) {
      logger.log('Applying delay')
      await new Promise(resolve => setTimeout(resolve, delayInMillis))
      logger.log('Delay has passed, resuming execution')
    }

    const c = new AbortController();
    const id = setTimeout(() => c.abort(), timeout);
    response = await fetch(...logger.logRequest(`${config.base_url}${config.terminal_id}/${endpoint}`, {
      signal: c.signal,
      method: method,
      headers: {
        "Authorization": `Bearer ${config.bearer_token}`,
        "pos-id": `${config.pos_id}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body,
    }))
      .then(unpackResponse)
      .then(response => logger.logResponse(response));
    clearTimeout(id);
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      response = [new Response(null, { status: 408 })]
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
  logger: ILogger,
  delayInMillis: number
): Promise<CustomerUidAndDiscount> {
  let discount = "";

  // Call the customers endpoint again on every one of
  // these until the customer object is no longer null
  // Possible status values that will be returned:
  // IDLE | CHECKING_IN | SELECTING_DISCOUNT | AWAITING_PAYMENT | AWAITING_CHECKOUT
  let [resp, returned_json] = await httpRequest("customers", "GET", null, config, logger,delayInMillis);

  if (resp.status == 200) {
    while (returned_json.customer == null) {
      const DEVICE_STATE = returned_json.device.device_state_title;
      logger.log(`Customer Terminal State: ${DEVICE_STATE}`);

      if (
        DEVICE_STATE == CustomerTerminalStateTypes.CHECKING_IN && thenCancel
      ) {
        // Cancel the transaction immediately
        [resp, returned_json] = await httpRequest("checkouts/cancel", "POST", null, config, logger, delayInMillis);

        // FIXME: second condition is probably wrong or incomplete
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

      [resp, returned_json] = await httpRequest("customers", "GET", null, config, logger,delayInMillis);
    }
  } else {
    logger.printOutcome(false, resp);
    return Promise.resolve({ discount: discount, uid: "" });
  }

  [resp, returned_json] = await httpRequest("customers", "GET", null, config, logger, delayInMillis);

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

    [resp, returned_json] = await httpRequest("customers", "GET", null, config, logger, delayInMillis);
  }

  logger.log("Customer data: ", returned_json);

  if (returned_json.customer.discounts.length > 0) {
    discount = returned_json.customer.discounts[0].uid;
  }

  return Promise.resolve({
    discount: discount,
    uid: returned_json.customer.uid,
  });
}
