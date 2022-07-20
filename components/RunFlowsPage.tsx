/** @jsx h */
import { tw } from "@twind";
import { h } from "preact";
import { useState } from "preact/hooks";
import Inspector from 'react-json-inspector';
import Button from '../components/Button.tsx';
import { cancelTransaction, runTransaction, useTransactionStatusMonitoring } from "../terminal-api/checkout.ts";
import { useCustomerServiceMonitoring } from "../terminal-api/customer.ts";
import { ILogger } from '../terminal-api/logger.ts';
import { ConfigurationSchema } from '../types/config.ts';
import { COMPLETED_FAILED_TRANSACTION_STATES, COMPLETED_SUCCESS_TRANSACTION_STATES, CreateTransactionResponse, CustomerTerminalStateTypes, Discount, TransactionStatusTypes, TransactionTypes } from "../types/transaction.ts";
import Modal from "./Modal.tsx";
import { useEffect } from 'preact/hooks'

interface Props {
  config: ConfigurationSchema
  logger: ILogger
}


export default function RunFlowsPage(props: Props) {
  const { config, logger } = props
  const [delay, setDelay] = useState(0)
  const [currentTransactionName, setCurrentTransactionName] = useState<string>()
  const [currentTransaction, setCurrentTransaction] = useState<CreateTransactionResponse>()
  const [approvedDiscount, setApprovedDiscount] = useState<Discount | null>()
  const [customerInformation] = useCustomerServiceMonitoring(delay >= 0 ? delay : 0, config, logger)
  const [isCancellingTransaction, setCancellingTransaction] = useState(false)
  const [transactionStatus] = useTransactionStatusMonitoring(
    currentTransaction?.pos_checkout_id, config, logger, delay)

  const well = tw`bg-gray-200 w-full p-5 rounded mb-2`
  const inputSpan = tw`text-center flex flex-col flex-grow-0 w-full`
  const input = tw`p-2 rounded border border-solid border-gray-400`
  const wellHeader = tw`text-center font-bold mb-4`

  const horizontalFlow = tw`flex flex-row gap-4`

  const updateDelayConfig = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
    setDelay(parseInt(evt.currentTarget.value) ?? '')

  const onClickTransactionButton = async (evt: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    const transactionName = evt.currentTarget.name

    logger.log(`Running transaction: ${transactionName}`)
    setCurrentTransactionName(transactionName)

    const transactionType = Object.values(TransactionTypes)[Object.keys(TransactionTypes).indexOf(transactionName)]
    const [response, json] = await runTransaction(
      transactionType, customerInformation!.customer.uid, approvedDiscount as Discount | null, config, logger, delay)
    console.log('Create transaction >> ', response, json)
    setCurrentTransaction(json)
  }

  const onClickCancelTransaction = () => {
    setCancellingTransaction(true)
    cancelTransaction(currentTransaction!.pos_checkout_id, config, logger, delay)
      .finally(() => setCancellingTransaction(false))
  }

  useEffect(() => {
    // monitor transaction status, update state and print outcome
    const clearTransactionState = () => {
      setCurrentTransaction(undefined)
      setCurrentTransactionName(undefined)
    }

    const status = transactionStatus?.status
    if (status) {
      if (COMPLETED_SUCCESS_TRANSACTION_STATES.includes(status)) {
        logger.printOutcome(true, new Response(null, { status: 200, statusText: status }))
        clearTransactionState()
      } else if (COMPLETED_FAILED_TRANSACTION_STATES.includes(status)) {
        logger.printOutcome(false, new Response(null, { status: 200, statusText: status }))
        clearTransactionState()
      }
    }
  }, [transactionStatus])

  const configurationInputsDisabled = Boolean(currentTransactionName)
  const transactionButtonsDisabled =
    Boolean(currentTransactionName) || delay < 0 || !customerInformation?.customer ||
    customerInformation?.device?.device_state_title === CustomerTerminalStateTypes.SELECTING_DISCOUNT
  const cancelTransactionButtonDisabled = !currentTransaction || isCancellingTransaction

  const isModalVisible = Boolean(customerInformation?.customer?.discounts?.length &&
    approvedDiscount === undefined)

  return (
    <div>
      <div class={horizontalFlow}>
        <div class={tw`${well} w-1/2`}>
          <h1 class={wellHeader}>Status</h1>
          {!customerInformation?.customer && 'Waiting for customer to checkin'}
          {customerInformation?.device?.device_state_title === CustomerTerminalStateTypes.SELECTING_DISCOUNT &&
            'User is selecting a discount'}
          {customerInformation?.device?.device_state_title === CustomerTerminalStateTypes.AWAITING_CHECKOUT
            && !currentTransaction
            && 'User is waiting for checkout, run a checkout transaction'}
          {!!(currentTransaction) && (
            'A transaction is running, you may cancel it'
          )}
        </div>
        <div class={tw`${well} w-1/2`}>
          <h1 class={wellHeader}>Flow Configuration</h1>
          <span class={inputSpan}>
            Delay between requests (ms) <input
              class={input}
              disabled={configurationInputsDisabled}
              type="number"
              value={delay}
              onInput={updateDelayConfig} />
          </span>
        </div>
        <div class={well}>
          <h1 class={wellHeader}>Run checkout transactions</h1>
          <div class={tw`flex gap-2 w-full justify-center`}>
            <Button
              disabled={transactionButtonsDisabled}
              name="cash"
              onClick={onClickTransactionButton}
            >Cash</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="credit"
              onClick={onClickTransactionButton}
            >Credit</Button>
            <Button
              disabled={transactionButtonsDisabled}
              name="other"
              onClick={onClickTransactionButton}
            >Other</Button>
          </div>
          <div class={tw`flex gap-2 w-full justify-center pt-3`}>
            <Button
              disabled={cancelTransactionButtonDisabled}
              name="cancel"
              onClick={onClickCancelTransaction}
            >Cancel</Button>
          </div>
        </div>
      </div>
      {Boolean(customerInformation || currentTransaction || transactionStatus) && (
        <div class={horizontalFlow}>
          {!!customerInformation && (
            <div class={tw`${well}`}>
              <h1 class={wellHeader}>Latest customer endpoint information</h1>
              <div>
                Device state: {customerInformation.device.device_state_title}
                <Inspector data={customerInformation} search={false} />
              </div>
            </div>
          )}
          {!!currentTransaction && (
            <div class={tw`${well}`}>
              <h1 class={wellHeader}>Latest transaction information</h1>
              <div>
                Transaction state: {transactionStatus?.status ?? currentTransaction?.status}
                <Inspector data={transactionStatus ?? currentTransaction} search={false} />
              </div>
            </div>
          )}
        </div>
      )}
      {isModalVisible && (
        <Modal>
          <div>The customer has selected a discount</div>
          <div>ID: {customerInformation?.customer?.discounts[0].uid}</div>
          <div>Type: {customerInformation?.customer?.discounts[0].type}</div>

          <div class={tw`mt-5 flex justify-center gap-10`}>
            <Button onClick={() => setApprovedDiscount(customerInformation?.customer?.discounts[0])}>
              Accept
            </Button>
            <Button onClick={() => setApprovedDiscount(null)}>
              Reject
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
