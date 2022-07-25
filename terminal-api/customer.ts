
import { useEffect, useState } from 'preact/hooks'
import { ConfigurationSchema } from "../types/config.ts";
import { CustomerInformation } from "../types/transaction.ts";
import { ILogger } from "./logger.ts";
import { httpRequest } from "./utils.ts";


export function useCustomerServiceMonitoring(
    delay: number, config: ConfigurationSchema, logger: ILogger
): [CustomerInformation | undefined] {
    const [customerInformation, setCustomerInformation] = useState<CustomerInformation>()

    useEffect(() => {
        let timeoutID: number
        const abortSignal = new AbortController()

        const updateCustomerInfo = async () => {
            // we may need to set a shorter timeout to avoid sync issues
            const [resp, returned_json] = await httpRequest(
                "customers", "GET", null, config, logger, delay, abortSignal)
            if (resp.ok) {
                setCustomerInformation(returned_json)
            }
            if (!abortSignal.signal.aborted) {
                timeoutID = setTimeout(updateCustomerInfo, 0)
            }
        }
        timeoutID = setTimeout(updateCustomerInfo, 0)

        return () => {
            clearTimeout(timeoutID)
            abortSignal.abort()
        }
    }, [delay])

    return [customerInformation]
}
