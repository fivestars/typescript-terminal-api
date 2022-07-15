// Deno: https://deno.land/
// With Visual Studio Code install the Deno extension: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
// Easiest way to run is with: deno run --allow-read --allow-env --allow-net index.ts

import { httpRequest, log, printOutcome } from "../terminal-api/utils.ts";

const resp = await httpRequest("ping", "GET", null);
const returned_json = await resp.json();

resp.status == 200 && returned_json.connected == true
    ? printOutcome(true, resp)
    : printOutcome(false, resp);

log(returned_json);


