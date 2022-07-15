import {
    bold,
    gray,
    green,
    red
} from "https://deno.land/std@0.123.0/fmt/colors.ts";
import { StateUpdater, useCallback, useEffect, useRef, useState } from 'preact/hooks';

export interface ILogger {
    log(...data: any[]): void
    printOutcome(successful: boolean, reponse: Response): void
}

export class ConsoleLogger implements ILogger {
    public log(...data: any[]): void {
        console.log(...data)
    }

    public printOutcome(successful = false, reponse: Response) {
        console.log(gray("--------------------------------------"));
        console.log(
            successful
                ? bold(green("Flow Outcome: Success"))
                : bold(red("Flow Outcome: Failed")),
        );
        console.log(`Status Code: ${reponse.status}`);
        console.log(gray("--------------------------------------"));
    }
}

class ReactStateLogger implements ILogger {
    private state: string[]
    private setter: StateUpdater<string[]>

    constructor(stateArray: string[], setter: StateUpdater<string[]>) {
        this.state = stateArray
        this.setter = setter
    }

    public updateReferences(array: string[], setter: StateUpdater<string[]>) {
        this.state = array
        this.setter = setter
    }

    log(...data: any[]): void {
        // TODO: we can use a more complex structure to represent logs and provide a better representation
        const updatedState = [
            ...this.state,
            data.map(d => typeof d === "object" ? JSON.stringify(d) : d).join(' ')
        ];
        this.state = updatedState
        this.setter(updatedState);
    }

    printOutcome(successful: boolean, reponse: Response): void {
        // TODO: we can use a more complex structure to represent logs and provide a better representation
        const updatedState = [
            ...this.state,
            `Flow Outcome: ${successful ? 'Success' : 'Failed'} >> Response status: ${reponse.status} `
        ];
        this.state = updatedState
        this.setter(updatedState);
    }
}

export function useLogger(): ([logEntries: string[], clearLogs: (() => void), logger: ILogger]) {
    const [logEntries, setLogEntries] = useState<string[]>([]);
    const loggerRef = useRef<ReactStateLogger>(new ReactStateLogger(logEntries, setLogEntries))

    // update methods to use reference to latest logEntries
    useEffect(() => {
        loggerRef.current.updateReferences(logEntries, setLogEntries)
    }, [logEntries, setLogEntries])

    const clearLogs = useCallback(() => {
        const emptyArray: string[] = []
        setLogEntries(emptyArray)
        // to ensure latest state before re-render
        loggerRef.current.updateReferences(emptyArray, setLogEntries)
    }, [logEntries, setLogEntries]);

    return [logEntries, clearLogs, loggerRef.current];
}