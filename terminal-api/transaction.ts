import { ConfigurationSchema } from '../types/config.ts';
import {
  generateIds,
  getCustomers,
  httpRequest
} from "./utils.ts";

import {
  PingResponse,
  TransactionStatusTypes,
  TransactionTypes
} from '../types/transaction.ts';
import { ConsoleLogger, ILogger } from "./logger.ts";

export default class TransactionRunner {
  private configuration: ConfigurationSchema
  private logger: ILogger
  private delayInMillis: number

  constructor(configuration: ConfigurationSchema, logger: ILogger = new ConsoleLogger(), delayInMillis = 0) {
    this.configuration = configuration
    this.logger = logger
    this.delayInMillis = delayInMillis
  }

  public async run(transactionType: TransactionTypes) {
    const customerUidAndDiscount = await getCustomers(false, this.configuration, this.logger, this.delayInMillis)

    const [posCheckoutId, posOrderId] = generateIds();

    const checkoutData = {
      checkout: {
        pos_checkout_id: posCheckoutId,
        type: transactionType,
        total: 750,
        customer_account_uid: customerUidAndDiscount.uid,
        discounts_applied: customerUidAndDiscount.discount.length > 0
          ? [customerUidAndDiscount.discount]
          : [],
      },
      order: {
        currency: "USD",
        pos_order_id: posOrderId,
        products: [
          {
            name: "hamburger",
            price: 250,
            price_with_vat: 0,
            quantity: 2,
            receipt_nest_level: 1,
            single_vat_amount: 0,
            total_price: 500,
            total_with_vat: 0,
            vat_rate: 0,
            vat_amount: 0,
          },
        ],
        subtotal: 0,
        tax: 125,
      },
    };

    // POST to checkouts
    let [resp, returned_json] = await httpRequest(
      "checkouts", "POST", JSON.stringify(checkoutData), this.configuration, this.logger, this.delayInMillis);

    if (
      resp.status == 200 &&
      returned_json.status == TransactionStatusTypes.TRANSACTION_STARTED
    ) {

      [resp, returned_json] = await httpRequest(
        `checkouts/${posCheckoutId}`, "GET", null, this.configuration, this.logger, this.delayInMillis);

      const transactionStatus = returned_json.status;

      if (transactionStatus == "SUCCESSFUL") {
        this.logger.printOutcome(true, resp);
        return;
      }
      this.logger.log(`Transaction Status: ${transactionStatus}`);

      while (transactionStatus != TransactionStatusTypes.SUCCESSFUL) {
        [resp, returned_json] = await httpRequest(
          `checkouts/${posCheckoutId}`, "GET", null, this.configuration, this.logger, this.delayInMillis);
        this.logger.printOutcome(true, resp);
      }
    } else {
      this.logger.printOutcome(false, resp);
    }
  }

  public async ping(): Promise<PingResponse> {
    const [resp, returned_json] = await httpRequest(
      "ping", "GET", null, this.configuration, this.logger, 0);

    resp.status == 200 && returned_json.connected == true
      ? this.logger.printOutcome(true, resp)
      : this.logger.printOutcome(false, resp);

    return returned_json
  }

  public async cancel() {
    const customerUidAndDiscount = await getCustomers(false, this.configuration, this.logger, this.delayInMillis);
    const [posCheckoutId, posOrderId] = generateIds();

    const checkoutData = {
      checkout: {
        pos_checkout_id: posCheckoutId,
        type: TransactionTypes.cash,
        total: 750,
        customer_account_uid: customerUidAndDiscount.uid,
        discounts_applied: [],
      },
      order: {
        currency: "USD",
        pos_order_id: posOrderId,
        products: [
          {
            name: "hamburger",
            price: 250,
            price_with_vat: 0,
            quantity: 2,
            receipt_nest_level: 1,
            single_vat_amount: 0,
            total_price: 500,
            total_with_vat: 0,
            vat_rate: 0,
            vat_amount: 0,
          },
        ],
        subtotal: 0,
        tax: 125,
      },
    };

    // POST to checkouts
    let [resp, returned_json] = await httpRequest(
      "checkouts", "POST", JSON.stringify(checkoutData), this.configuration, this.logger, this.delayInMillis);

    if (
      resp.status == 200 &&
      returned_json.status == TransactionStatusTypes.TRANSACTION_STARTED
    ) {
      [resp, returned_json] = await httpRequest(
        `checkouts/${posCheckoutId}/cancel`, "POST", null, this.configuration, this.logger, this.delayInMillis);

      if (returned_json.status == TransactionStatusTypes.TRANSACTION_CANCELED) {
        this.logger.printOutcome(true, resp);
      } else {
        this.logger.printOutcome(false, resp);
      }
    } else {
      this.logger.printOutcome(false, resp);
    }
  }
}
