/** @jsx h */
import { tw } from "@twind";
import { h } from "preact";
import { useState } from "preact/hooks";
import Button from "../components/Button.tsx";
import ConfigurationPage from "../components/ConfigurationPage.tsx";
import LogEntry from "../components/LogEntry.tsx";
import RunFlowsPage from "../components/RunFlowsPage.tsx";
import { useLogger } from "../terminal-api/logger.ts";
import { ConfigurationSchema } from '../types/config.ts';

interface Props {
  defaultConfig: ConfigurationSchema
}

export default function App(props: Props) {
  const [config, setConfig] = useState(props?.defaultConfig)
  const [hasEstablishedConnection, setHasEstablishedConnection] = useState(false)
  const [logEntries, clearLogs, logger] = useLogger()

  const updateConfigValue = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setConfig({
    ...config,
    [evt.currentTarget.name]: evt.currentTarget.value
  })

  const wellHeader = tw`text-center font-bold mb-4`

  return (
    <div>
      {!hasEstablishedConnection && (
        <ConfigurationPage
          logger={logger}
          clearLogs={clearLogs}
          config={config}
          onUpdateConfigValue={updateConfigValue}
          onConnectionSuccess={() => setHasEstablishedConnection(true)}
        />
      )}
      {hasEstablishedConnection && (
        <RunFlowsPage
          config={config}
          logger={logger}
        />
      )}
      <div class={`${tw`pt-4 relative w-full`}`}>
        <h1 class={wellHeader}>
          Logs 
          <Button onClick={clearLogs} additionalClasses={tw`float-right -translate-y-1/4`}>Clear logs</Button>
        </h1>
        {logEntries.map(log => <LogEntry log={log} />)}
        {!logEntries.length && 'Logs are empty.'}
      </div>
    </div>
  );
}
