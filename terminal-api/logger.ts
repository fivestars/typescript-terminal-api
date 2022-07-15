import {
    bold,
    gray,
    green,
    red
} from "https://deno.land/std@0.123.0/fmt/colors.ts";

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