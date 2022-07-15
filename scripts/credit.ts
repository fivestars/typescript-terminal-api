// Deno: https://deno.land/
// With Visual Studio Code install the Deno extension: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
// Easiest way to run is with: deno run --allow-read --allow-env --allow-net index.ts

import { transactionTypes } from '../types/transaction.ts'
import { runTransaction } from "../terminal-api/transaction.ts";

// Credit Transaction
runTransaction(transactionTypes.credit);
