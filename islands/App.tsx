/** @jsx h */
import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import { ConfigurationSchema } from '../types/config.ts'
import { TransactionTypes } from "../types/transaction.ts";
import TransactionRunner from '../terminal-api/transaction.ts'

interface AppProps {
  defaultConfig: ConfigurationSchema
}


export default function App(props: AppProps) {
  const [config, setConfig] = useState(props?.defaultConfig)
  const [delay, setDelay] = useState(0)

  const btn = tw`px-3 py-2 border(gray-100 1) bg-gray-100 hover:bg-gray-200 rounded`;
  const well = tw`bg-gray-200 w-full p-5 rounded mb-2`
  const inputSpan = tw`text-center`
  const wellHeader = tw`text-center font-bold mb-4`

  const updateConfigValue = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setConfig({
    ...config,
    [evt.currentTarget.name]: evt.currentTarget.value
  })

  const updateDelayConfig = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
    setDelay(parseInt(evt.currentTarget.value) ?? '')

  const runTransaction = (evt: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    const transactionName = evt.currentTarget.name
    const transactionRunner = new TransactionRunner(config, undefined, delay)

    console.log('Running transaction:', transactionName)
    console.log('Enum keys:', Object.keys(TransactionTypes))

    if (transactionName in TransactionTypes) {
      transactionRunner.run(
        Object.values(TransactionTypes)[Object.keys(TransactionTypes).indexOf(transactionName)]
      )
    } else if (transactionName === 'ping') {
      transactionRunner.ping()
    } else if (transactionName === 'cancel') {
      transactionRunner.cancel()
    } else {
      console.error("Unknown transaction: ", transactionName)
    }
  }

  return (
    <Fragment>
      <div class={well}>
        <h1 class={wellHeader}>Configuration</h1>
        <div class={tw`flex gap-4 w-full justify-between`}>
          <span class={inputSpan}>
            Base URL <input
              type="text"
              name="base_url"
              value={config.base_url}
              onInput={updateConfigValue}
            />
          </span>

          <span class={inputSpan}>
            Token <input
              type="text"
              name="bearer_token"
              value={config.bearer_token}
              onInput={updateConfigValue} />
          </span>

          <span class={inputSpan}>
            POS ID <input
              type="text"
              name="pos_id"
              value={config.pos_id}
              onInput={updateConfigValue} />
          </span>

          <span class={inputSpan}>
            Terminal ID <input
              type="text"
              name="terminal_id"
              value={config.terminal_id}
              onInput={updateConfigValue} />
          </span>
        </div>
      </div>
      <div class={well}>
        <h1 class={wellHeader}>Flow Configuration</h1>
        <div class={tw`flex gap-2 w-full`}>
          Delay between requests <input
            type="number"
            value={delay}
            onInput={updateDelayConfig} />
        </div>
      </div>
      <div class={well}>
        <h1 class={wellHeader}>Payment flows</h1>
        <div class={tw`flex gap-2 w-full`}>
          <button class={btn} name="ping" onClick={runTransaction}>Ping</button>
          <button class={btn} name="cash" onClick={runTransaction}>Cash</button>
          <button class={btn} name="credit" onClick={runTransaction}>Credit</button>
          <button class={btn} name="other" onClick={runTransaction}>Other</button>
          <button class={btn} name="cancel" onClick={runTransaction}>Cancel</button>
        </div>
      </div>
      <div class={well}>
        <h1 class={wellHeader}>Logs</h1>
      </div>
    </Fragment>
  );
}
