import {
  generateIds,
  getCustomers,
  httpRequest,
  log,
  printOutcome,
  TransactionStatusTypes,
  transactionTypes,
} from "./utils.ts";

export async function runTransaction(transactionType: transactionTypes) {
  const customerUidAndDiscount = await getCustomers(
    false,
  );
  const [posCheckoutId, posOrderId] = generateIds();

  const checkoutData = JSON.stringify({
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
  });

  // POST to checkouts
  log(checkoutData);
  let resp = await httpRequest("checkouts", "POST", checkoutData);
  let returned_json = await resp.json();

  if (
    resp.status == 200 &&
    returned_json.status == TransactionStatusTypes.TRANSACTION_STARTED
  ) {
    resp = await httpRequest(`checkouts/${posCheckoutId}`, "GET", null);
    returned_json = await resp.json();

    const transactionStatus = returned_json.status;

    if (transactionStatus == "SUCCESSFUL") {
      printOutcome(true, resp);
      return;
    }
    log(`Transaction Status: ${transactionStatus}`);

    while (transactionStatus != TransactionStatusTypes.SUCCESSFUL) {
      resp = await httpRequest(`checkouts/${posCheckoutId}`, "GET", null);
      printOutcome(true, resp);
    }
  } else {
    printOutcome(false, resp);
  }
}
