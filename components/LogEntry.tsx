/** @jsx h */
import { tw } from "@twind";
import { Fragment, h } from "preact";
import {
    LogEntry as LogEntryType, LogType, LogMessage, OutcomeLog, RequestLog, ResponseLog
} from '../types/logger.ts'
// https://github.com/denoland/fresh/issues/411#issuecomment-1177462538
import Inspector from 'react-json-inspector'

interface LogEntryProps {
    log: LogEntryType
}

const logTypeLabels = {
    [LogType.LOG]: 'Log message',
    [LogType.REQUEST]: 'Request',
    [LogType.RESPONSE]: 'Response',
    [LogType.OUTCOME]: 'Flow outcome'
}

export default function LogEntry(props: LogEntryProps) {
    const { log } = props
    let isSuccess: boolean | null = null

    if (log.type === LogType.OUTCOME) {
        isSuccess = log.successful
    } else if (log.type === LogType.RESPONSE) {
        isSuccess = log.ok
    }

    const logEntry = tw`flex flex-row pb-3 w-full gap-2 items-center box-content`
    const box = tw`rounded bg-gray-100 p-2 border border-solid border-gray-300`
    const success = tw`bg-green-400`
    const failed = tw`bg-red-400`
    const logField = tw`mr-1`
    const logFieldNoShrink = tw`${logField} flex-shrink-0`

    const renderMessage = (log: LogMessage) => log.data.map(d =>
        typeof d === "object"
            ? <Inspector data={d} search={false} />
            : d
    ).join(' ')

    const renderOutcome = ({ successful, response }: OutcomeLog) => (
        `${successful ? 'Success' : 'Failed'} >> Response status: ${response.status} ${response.statusText || ''}`
    )

    const renderRequest = (log: RequestLog) => (
        <Fragment>
            <div class={logFieldNoShrink}>
                <span class={box}>{log.method}</span>
            </div>
            <div class={logField}>{log.url}</div>
            {log.body && <Inspector data={log.body} search={false} />}
        </Fragment>
    )

    const renderResponse = (log: ResponseLog) => (
        <Fragment>
            <div class={logFieldNoShrink}>
                <span class={box}>Status: {log.status} {log.statusText}</span>
            </div>
            <div class={logField}>
                {log.body && (
                    <Inspector data={log.body} search={false} />
                )}
            </div>
        </Fragment>
    )

    return (
        <p class={logEntry}>
            <div class={isSuccess !== null ? tw`${box} ${isSuccess ? success : failed}` : box}>
                {logTypeLabels[log.type]}
            </div>
            {log.type === LogType.LOG &&
                renderMessage(log)}
            {log.type === LogType.OUTCOME
                && renderOutcome(log)}
            {log.type === LogType.REQUEST
                && renderRequest(log)}
            {log.type === LogType.RESPONSE
                && renderResponse(log)}
        </p>
    )
}
