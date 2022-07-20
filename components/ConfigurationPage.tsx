/** @jsx h */
import { tw } from "@twind";
import { h } from "preact";
import { useState } from 'preact/hooks';
import Button from "../components/Button.tsx";
import { validateConfig } from "../config/index.ts";
import { ILogger } from "../terminal-api/logger.ts";
import TransactionRunner from "../terminal-api/transaction.ts";
import { ConfigurationSchema } from '../types/config.ts';

interface Props {
  logger: ILogger,
  config: ConfigurationSchema,
  clearLogs: () => void
  onUpdateConfigValue: (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => void,
  onConnectionSuccess: () => void
}


export default function ConfigurationPage(props: Props) {
  const { logger, config, clearLogs, onUpdateConfigValue, onConnectionSuccess } = props
  const [testingConnection, setTestingConnection] = useState(false)

  const well = tw`bg-gray-200 w-full p-5 rounded mb-2`
  const inputSpan = tw`text-center flex flex-col flex-grow-0 w-full`
  const input = tw`p-2 rounded border border-solid border-gray-400`
  const wellHeader = tw`text-center font-bold mb-4`

  function onTestConnection() {
    clearLogs()
    const transactionRunner = new TransactionRunner(config, logger, 0)
    setTestingConnection(true)
    console.log('Ran test connection')
    transactionRunner
      .ping()
      .then(pingResponse => pingResponse?.connected && onConnectionSuccess())
      .finally(() => setTestingConnection(false))
  }

  const configurationInputsDisabled = Boolean(testingConnection)

  return (
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
            onInput={onUpdateConfigValue}
          />
        </span>

        <span class={inputSpan}>
          Token <input
            class={input}
            disabled={configurationInputsDisabled}
            type="text"
            name="bearer_token"
            value={config.bearer_token}
            onInput={onUpdateConfigValue} />
        </span>

        <span class={inputSpan}>
          POS ID <input
            class={input}
            disabled={configurationInputsDisabled}
            type="text"
            name="pos_id"
            value={config.pos_id}
            onInput={onUpdateConfigValue} />
        </span>

        <span class={inputSpan}>
          Terminal ID <input
            class={input}
            disabled={configurationInputsDisabled}
            type="text"
            name="terminal_id"
            value={config.terminal_id}
            onInput={onUpdateConfigValue} />
        </span>
      </div>
      <div class={tw`pt-4 w-full text-center`}>
        <Button
          disabled={testingConnection || !validateConfig(config)}
          onClick={onTestConnection}
        >Test connection (ping)</Button>
      </div>
    </div>
  );
}
