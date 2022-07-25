# Typescript Terminal API Example Code Flows

TypeScript based flows for driving the Terminal API

## Install Deno

Deno: [https://deno.land/](https://deno.land/)

For Visual Studio Code install the Deno extension: [https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

## Configuring credentials

First of all you should edit the `config/default.json` file and update it with your credentials. These will be used by the scripts and will be used to fill in the default values in the UI.

## Running a simple UI

Start the UI server using the command: `deno task start`

You'll need to access it using a browser with disabled security to allow CORS.
You may use the command `deno task browser` in Linux or `deno task browser-mac` in MacOS.

## Running scripts to invoke services

You may list all available tasks using `deno task`.
use the following commands to run each of the transaction flows:

`deno task tx-ping`

`deno task tx-cash`

`deno task tx-credit`

`deno task tx-other`

`deno task tx-cancel`
