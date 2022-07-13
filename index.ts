// Deno: https://deno.land/
// With Visual Studio Code install the Deno extension: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
// Easiest way to run is with: deno run --allow-read --allow-env --allow-net index.ts

import { httpRequest, log, printOutcome, transactionTypes } from "./utils.ts";
import { runTransaction } from "./transaction.ts";
import { cancelTransaction } from "./cancel_txn.ts";

async function ping() {
  const resp = await httpRequest("ping", "GET", null);
  const returned_json = await resp.json();

  resp.status == 200 && returned_json.connected == true
    ? printOutcome(true, resp)
    : printOutcome(false, resp);

  log(returned_json);
}

// Uncomment the transaction flow you want to run

// Ping the customer terminal
ping()

// Cash Transaction
// runTransaction(transactionTypes.cash);

// Credit Transaction
// runTransaction(transactionTypes.credit);

// Other Transaction (loyalty reward points)
// runTransaction(transactionTypes.other);

// Cancel transaction
// cancelTransaction();
