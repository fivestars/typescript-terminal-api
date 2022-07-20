import {
    bold,
    gray,
    green,
    red
} from "https://deno.land/std@0.123.0/fmt/colors.ts";
import { StateUpdater, useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { LogEntry, LogMessage, LogType, OutcomeLog, RequestLog, ResponseLog } from "../types/logger.ts";
import { UnpackedResponse } from "../types/utils.ts";

export interface ILogger {
    logResponseError(error: any): void
    log(...data: any[]): void
    logRequest(
        input: URL | Request | string,
        init?: RequestInit): [input: URL | Request | string, init?: RequestInit]
    logResponse(response: UnpackedResponse): UnpackedResponse
    printOutcome(successful: boolean, response: Response): void
}

export class ConsoleLogger implements ILogger {
    log(...data: any[]): void {
        console.log(...data)
    }

    logRequest(input: string | URL | Request, init?: RequestInit | undefined): [input: string | URL | Request, init?: RequestInit | undefined] {
        return [input, init]
    }

    logResponse(response: UnpackedResponse): UnpackedResponse {
        return response
    }

    logResponseError(error: any): void {
        console.log('Response error: ', error)
    }

    printOutcome(successful = false, response: Response) {
        console.log(gray("--------------------------------------"));
        console.log(
            successful
                ? bold(green("Flow Outcome: Success"))
                : bold(red("Flow Outcome: Failed")),
        );
        console.log(`Status Code: ${response.status}`);
        console.log(gray("--------------------------------------"));
    }
}

class ReactStateLogger implements ILogger {
    private state: LogEntry[]
    private setter: StateUpdater<LogEntry[]>

    constructor(stateArray: LogEntry[], setter: StateUpdater<LogEntry[]>) {
        this.state = stateArray
        this.setter = setter
    }

    updateReferences(array: LogEntry[], setter: StateUpdater<LogEntry[]>) {
        this.state = array
        this.setter = setter
    }

    private tryParseJSON(json?: BodyInit | null) {
        try {
            if (json && typeof json === "string") {
                return JSON.parse(json)
            }
        } catch (_) {
            return json
        }
        return json
    }

    logRequest(input: string | URL | Request, init?: RequestInit | undefined):
        [input: string | URL | Request, init?: RequestInit | undefined] {
        this.appendLog({
            type: LogType.REQUEST,
            url: input as string,
            method: init?.method ?? 'GET',
            body: this.tryParseJSON(init?.body)
        } as RequestLog)
        return [input, init]
    }

    logResponse(unpackedResponse: UnpackedResponse): UnpackedResponse {
        const [response, body] = unpackedResponse
        console.log('Logging response: ', response, this)
        this.appendLog({
            type: LogType.RESPONSE,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            body
        } as ResponseLog)
        console.log('Logging response: ', response)
        return unpackedResponse
    }

    logResponseError(error: any): void {
        this.appendLog({
            type: LogType.RESPONSE,
            ok: false,
            status: NaN,
            statusText: error
        } as ResponseLog)
    }

    log(...data: any[]): void {
        this.appendLog({ type: LogType.LOG, data } as LogMessage)
    }

    printOutcome(successful: boolean, response: Response): void {
        this.appendLog({ type: LogType.OUTCOME, successful, response } as OutcomeLog)
    }

    private appendLog(log: LogEntry) {
        const updatedState = [...this.state, log];
        this.state = updatedState
        this.setter(updatedState);
    }
}

export function useLogger(): ([logEntries: LogEntry[], clearLogs: (() => void), logger: ILogger]) {
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
    const loggerRef = useRef<ReactStateLogger>(new ReactStateLogger(logEntries, setLogEntries))

    // update methods to use reference to latest logEntries
    useEffect(() => {
        loggerRef.current.updateReferences(logEntries, setLogEntries)
    }, [logEntries, setLogEntries])

    const clearLogs = useCallback(() => {
        const emptyArray: LogEntry[] = []
        setLogEntries(emptyArray)
        // to ensure latest state before re-render
        loggerRef.current.updateReferences(emptyArray, setLogEntries)
    }, [logEntries, setLogEntries]);

    return [logEntries, clearLogs, loggerRef.current];
}