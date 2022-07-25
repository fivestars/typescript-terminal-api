// Deno: https://deno.land/
// With Visual Studio Code install the Deno extension: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
// Easiest way to run is with: deno run --allow-read --allow-env --allow-net index.ts

import TransactionRunner from '../terminal-api/transaction.ts'
import readConfig from '../config/index.ts'
import { TransactionTypes } from '../types/transaction.ts'


// Cash Transaction
new TransactionRunner(readConfig()).run(TransactionTypes.cash);
