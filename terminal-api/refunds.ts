
import { ConfigurationSchema } from "../types/config.ts";
import { ILogger } from "./logger.ts";
import { httpRequest } from "./utils.ts";


export const refund = (
    checkoutReference: string, refundAmount: number, config: ConfigurationSchema, logger: ILogger, delayInMillis: number
) => httpRequest(`refunds/${checkoutReference}`, "POST", JSON.stringify({"amount": refundAmount}), config, logger, delayInMillis)
