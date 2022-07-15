/** @jsx h */
import { tw } from "@twind";
import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import Button from '../components/Button.tsx';
import { validateConfig } from '../config/index.ts';
import { useLogger } from '../terminal-api/logger.ts';
import TransactionRunner from '../terminal-api/transaction.ts';
import { ConfigurationSchema } from '../types/config.ts';
import { TransactionTypes } from "../types/transaction.ts";

interface AppProps {
  defaultConfig: ConfigurationSchema
}


export default function App(props: AppProps) {
  const [config, setConfig] = useState(props?.defaultConfig)
  const [delay, setDelay] = useState(0)
  const [currentTransactionName, setCurrentTransactionName] = useState<string>()
  const [logEntries, clearLogs, logger] = useLogger()

  const well = tw`bg-gray-200 w-full p-5 rounded mb-2`
  const inputSpan = tw`text-center flex flex-col flex-grow-0 w-full`
  const input = tw`p-2 rounded border border-solid border-gray-400`
  const wellHeader = tw`text-center font-bold mb-4`
  const logEntry = tw`pb-2`
  const horizontalFlow = tw`flex flex-row gap-4`

  const updateConfigValue = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setConfig({
    ...config,
    [evt.currentTarget.name]: evt.currentTarget.value
  })

  const updateDelayConfig = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
    setDelay(parseInt(evt.currentTarget.value) ?? '')

  const runTransaction = (evt: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clearLogs()

    const transactionName = evt.currentTarget.name
    const transactionRunner = new TransactionRunner(config, logger, delay)

    logger.log(`Running transaction: ${transactionName}`)
    setCurrentTransactionName(transactionName)
    if (transactionName in TransactionTypes) {
      transactionRunner
        .run(Object.values(TransactionTypes)[Object.keys(TransactionTypes).indexOf(transactionName)])
        .finally(() => setCurrentTransactionName(undefined))
    } else if (transactionName === 'ping') {
      transactionRunner
        .ping()
        .finally(() => setCurrentTransactionName(undefined))
    } else if (transactionName === 'cancel') {
      transactionRunner
        .cancel()
        .finally(() => setCurrentTransactionName(undefined))
    } else {
      console.error("Unknown transaction: ", transactionName)
      setCurrentTransactionName(undefined)
    }
  }

  const configurationInputsDisabled = Boolean(currentTransactionName)
  const transactionButtonsDisabled = Boolean(currentTransactionName) || !validateConfig(config) || delay < 0

  return (
    <Fragment>
      <div class={well}>
        <h1 class={wellHeader}>Configuration</h1>
        <div class={tw`flex gap-4 w-full justify-between`}>
          <span class={inputSpan}>
            Base URL <input
              class={input}
              disabled={configurationInputsDisabled}
              type="text"
              name="base_url"
              value={config.base_url}
              onInput={updateConfigValue}
            />
          </span>

          <span class={inputSpan}>
            Token <input
              class={input}
              disabled={configurationInputsDisabled}
              type="text"
              name="bearer_token"
              value={config.bearer_token}
              onInput={updateConfigValue} />
          </span>

          <span class={inputSpan}>
            POS ID <input
              class={input}
              disabled={configurationInputsDisabled}
              type="text"
              name="pos_id"
              value={config.pos_id}
              onInput={updateConfigValue} />
          </span>

          <span class={inputSpan}>
            Terminal ID <input
              class={input}
              disabled={configurationInputsDisabled}
              type="text"
              name="terminal_id"
              value={config.terminal_id}
              onInput={updateConfigValue} />
          </span>
        </div>
      </div>
      <div class={horizontalFlow}>
        <div class={tw`${well} w-1/2`}>
          <h1 class={wellHeader}>Flow Configuration</h1>
          <span class={inputSpan}>
            Delay between requests (ms) <input
              class={input}
              disabled={configurationInputsDisabled}
              type="number"
              value={delay}
              onInput={updateDelayConfig} />
          </span>
        </div>
        <div class={well}>
          <h1 class={wellHeader}>Run payment flows</h1>
          <div class={tw`flex gap-2 w-full justify-center`}>
            <Button
              disabled={transactionButtonsDisabled}
              name="ping"
              onClick={runTransaction}
            >Ping</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="cash"
              onClick={runTransaction}
            >Cash</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="credit"
              onClick={runTransaction}
            >Credit</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="other"
              onClick={runTransaction}
            >Other</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="cancel"
              onClick={runTransaction}
            >Cancel</Button>
          </div>
        </div>
      </div>
      <div class={well}>
        <h1 class={wellHeader}>Logs</h1>
        {logEntries.map(log => <p class={logEntry}>{log}</p>)}
      </div>
    </Fragment>
  );
}
