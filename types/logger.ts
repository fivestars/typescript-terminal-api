export enum LogType {
    LOG, REQUEST, RESPONSE, OUTCOME
}

export interface LogMessage {
    type: LogType.LOG
    data: any[]
}

export interface RequestLog {
    type: LogType.REQUEST
    url: string
    method: string
    body?: BodyInit
}

export interface ResponseLog {
    type: LogType.RESPONSE
    ok: boolean
    status: number
    statusText: string
    body?: any
}

export interface OutcomeLog {
    type: LogType.OUTCOME
    successful: boolean
    response: Response
}

export type LogEntry = LogMessage | RequestLog | ResponseLog | OutcomeLog
