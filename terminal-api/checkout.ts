
import { useEffect, useState } from 'preact/hooks';
import { ConfigurationSchema } from "../types/config.ts";
import { COMPLETED_TRANSACTION_STATES, Discount, TransactionStatusResponse, TransactionTypes } from "../types/transaction.ts";
import { ILogger } from "./logger.ts";
import { createSampleCheckoutData, generateIds, httpRequest } from "./utils.ts";


export const runTransaction = (
    transactionType: TransactionTypes, customerID: string, discount: Discount | null, config: ConfigurationSchema,
    logger: ILogger, delayInMillis: number
) => {
    const [posCheckoutId, posOrderId] = generateIds();
    return httpRequest(
        "checkouts",
        "POST",
        JSON.stringify(createSampleCheckoutData(posCheckoutId, posOrderId, transactionType, customerID, discount)),
        config,
        logger,
        delayInMillis
    )
}

export const cancelTransaction = (
    posCheckoutId: string | undefined, config: ConfigurationSchema, logger: ILogger, delayInMillis: number
) => httpRequest(`checkouts${posCheckoutId ? `/${posCheckoutId}` : ''}/cancel`, "POST", null, config, logger, delayInMillis)

export const switchtoCashTransaction = (config: ConfigurationSchema, logger: ILogger, delayInMillis: number
) => httpRequest('checkouts', "PUT", '{"checkout": {"type": "CASH"}}', config, logger, delayInMillis)

export function useTransactionStatusMonitoring(
    posCheckoutId: string | undefined, config: ConfigurationSchema, logger: ILogger,
    delayInMillis: number
) {
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatusResponse>()

    useEffect(() => {
        let cancel = false
        let timeoutID: number

        if (posCheckoutId) {
            const getTransactionStatus = async () => {
                const [resp, returned_json] =
                    await httpRequest(`checkouts/${posCheckoutId}`, "GET", null, config, logger, delayInMillis)
                console.log('Checkout info >> ', resp, returned_json, '>> Cancel:', cancel)
                if (resp.ok && !cancel) {
                    setTransactionStatus(returned_json)
                }
                if (!cancel && !COMPLETED_TRANSACTION_STATES.includes(returned_json?.status)) {
                    timeoutID = setTimeout(getTransactionStatus, 0)
                }
            }
            timeoutID = setTimeout(getTransactionStatus, 0)
        } else {
            setTransactionStatus(undefined)
        }
        return () => {
            cancel = true
            clearTimeout(timeoutID)
        }

    }, [posCheckoutId])

    return [transactionStatus]
}
