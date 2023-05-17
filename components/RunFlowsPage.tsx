/** @jsx h */
import { tw } from "@twind";
import { h } from "preact";
import { useState } from "preact/hooks";
import Inspector from 'react-json-inspector';
import Button from '../components/Button.tsx';
import { cancelTransaction, skipCurrentScreen, switchtoCashTransaction, runTransaction, useTransactionStatusMonitoring } from "../terminal-api/checkout.ts";
import { refund } from "../terminal-api/refunds.ts";
import { useCustomerServiceMonitoring } from "../terminal-api/customer.ts";
import { ILogger } from '../terminal-api/logger.ts';
import { ConfigurationSchema } from '../types/config.ts';
import { COMPLETED_FAILED_TRANSACTION_STATES, COMPLETED_SUCCESS_TRANSACTION_STATES, CreateTransactionResponse, CustomerInformation, CustomerTerminalStateTypes, Discount, TransactionStatusTypes, TransactionTypes } from "../types/transaction.ts";
import Modal from "./Modal.tsx";
import { useEffect } from 'preact/hooks'
import { useCallback } from 'preact/hooks'
import { debounce } from "../terminal-api/utils.ts";

interface Props {
  config: ConfigurationSchema
  logger: ILogger
}


export default function RunFlowsPage(props: Props) {
  const { config, logger } = props
  const [delay, setDelay] = useState(0)
  const [checkoutReference, setCheckoutReference] = useState<string>("")
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [currentTransactionName, setCurrentTransactionName] = useState<string>()
  const [currentTransaction, setCurrentTransaction] = useState<CreateTransactionResponse>()
  const [approvedDiscount, setApprovedDiscount] = useState<Discount | null>()
  const [customerInformation] = useCustomerServiceMonitoring(delay >= 0 ? delay : 0, config, logger)
  const [isCancellingTransaction, setCancellingTransaction] = useState(false)
  const [transactionStatus] = useTransactionStatusMonitoring(
    currentTransaction?.pos_checkout_id, config, logger, delay)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>()
  const [overridenDiscount, setOverrideDiscount] = useState<Discount | null>()
  const [skipTip, setSkipTip] = useState<boolean>(false)
  const [skipRewardNotification, setSkipRewardNotification] = useState<boolean>(false)
  const [attemptOverrideDiscount, setAttemptOverrideDiscount] = useState<boolean>(false)

  const well = tw`bg-gray-200 w-full p-5 rounded mb-2`
  const inputSpan = tw`text-center flex flex-col flex-grow-0 w-full`
  const input = tw`p-2 rounded border border-solid border-gray-400`
  const wellHeader = tw`text-center font-bold mb-4`

  const horizontalFlow = tw`flex flex-row gap-4`

  const updateDelayConfig = useCallback(
    debounce(
      (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
        setDelay(
          parseInt((evt.target as HTMLInputElement).value) ?? ''
        ),
      500
    ), [])

  const onUpdateCheckoutReference = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setCheckoutReference(evt.currentTarget.value)
  }

  const onUpdateRefundAmount = (evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setRefundAmount(parseInt(evt.currentTarget.value))
  }

  const onClickTransactionButton = async (evt: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    const transactionName = evt.currentTarget.name

    logger.log(`Running transaction: ${transactionName}`)
    setCurrentTransactionName(transactionName)

    const transactionType = Object.values(TransactionTypes)[Object.keys(TransactionTypes).indexOf(transactionName)]
    const [response, json] = await runTransaction(
      transactionType,
       customerInformation!.customer.uid,
       (attemptOverrideDiscount ? overridenDiscount  as Discount | null : approvedDiscount as Discount | null),
       config,
       logger,
       delay,
       skipTip,
       skipRewardNotification
    )
    console.log('Create transaction >> ', response, json)
    setCurrentTransaction(json)
  }

  const onClickCancelTransaction = () => {
    setCancellingTransaction(true)
    cancelTransaction(currentTransaction?.pos_checkout_id, config, logger, delay)
      .finally(() => setCancellingTransaction(false))
  }

  const onClickSwitchToCashTransaction = () => {
    switchtoCashTransaction(config, logger, delay)
      .finally(() => console.log('Switched transaction to >> cash'))
  }

  const onClickSkipCurrentScreen = () => {
    skipCurrentScreen(config, logger, delay)
      .finally(() => console.log('Attempting to skip current screen'))
  }

  const onClickRefund = () => {
    logger.log(`Attempting refund: ${checkoutReference} for $${refundAmount}`)

    refund(checkoutReference, refundAmount, config, logger, delay)
    .then((value) => {
        console.log('Refund result >> ', value)
    }).catch((err) => {
        console.log(err)
    })
  }

  const isDiscountSelected = (customerInformation?: CustomerInformation): boolean => {
    if(!customerInformation?.customer) return false;
    setPossibleOverrideDiscount(customerInformation.customer.discounts);
    for (const item of customerInformation.customer.discounts) {
        if (item.selected) {
            setSelectedDiscount(item);
            return true;
        }
    }
    return false;
  }

  const setPossibleOverrideDiscount = (discounts: Discount[]) => {
    for (const item of discounts) {
        if (!item.selected) {
            setOverrideDiscount(item);
            return;
        }
    }
  }

  const onChangeCheckboxHandler = (command: string, evt: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
    switch(command) {
        case 'skipTip': {
            setSkipTip((prev) => !prev)
            logger.log(`${command} will not be shown`);
            break;
        }
        case 'skipRewardNotification': {
            setSkipRewardNotification((prev) => !prev)
            logger.log(`${command} will not be shown`);
            break;
        }
        case 'attemptOverrideDiscount': {
            setAttemptOverrideDiscount((prev) => !prev)
            logger.log(`If possible - overriding discount/reward`);
            break;
        }
    }
  }

  useEffect(() => {
    // monitor transaction status, update state and print outcome
    const clearTransactionState = () => {
      setCurrentTransaction(undefined)
      setCurrentTransactionName(undefined)
      setSkipTip(false)
      setSkipRewardNotification(false)
      setAttemptOverrideDiscount(false)
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

  useEffect(() => {
    if(customerInformation?.device?.device_state_title === CustomerTerminalStateTypes.IDLE) {
      setApprovedDiscount(undefined)
      setOverrideDiscount(undefined)
    }
  }, [customerInformation])

  const configurationInputsDisabled = Boolean(currentTransactionName)
  const transactionButtonsDisabled =
    Boolean(currentTransactionName) || delay < 0 || !customerInformation?.customer ||
    customerInformation?.device?.device_state_title === CustomerTerminalStateTypes.SELECTING_DISCOUNT
  const cancelTransactionButtonDisabled = isCancellingTransaction

  const isModalVisible = Boolean(isDiscountSelected(customerInformation) && approvedDiscount === undefined)

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
            <Button
              disabled={cancelTransactionButtonDisabled}
              name="switchToCash"
              onClick={onClickSwitchToCashTransaction}
            >Switch to Cash</Button>
          </div>
          <div class={tw`flex gap-2 w-full justify-center pt-3`}>
            <Button
              name="skipScreen"
              onClick={onClickSkipCurrentScreen}
            >Skip Current Screen</Button>
          </div>
          <div class={tw`flex gap-2 w-full justify-left pt-1`}>
            <input
                name="skipTipCheckbox"
                type="checkbox"
                defaultChecked={skipTip}
                checked={skipTip}
                id="skipTipCheckbox"
                onChange={(e) => { onChangeCheckboxHandler('skipTip', e) }}
            />
            <label
                class="inline-block pl-[0.15rem] hover:cursor-pointer"
                for="skipTipCheckbox">
                    Skip Tip Screen
            </label>
          </div>
          <div class={tw`flex gap-2 w-full justify-left pt-1`}>
            <input
                name="skipRewardNotifcationCheckbox"
                type="checkbox"
                defaultChecked={skipRewardNotification}
                checked={skipRewardNotification}
                id="skipRewardNotifcationCheckbox"
                onChange={(e) => { onChangeCheckboxHandler('skipRewardNotification', e) }}
            />
            <label
                class="inline-block pl-[0.15rem] hover:cursor-pointer"
                for="skipRewardNotifcationCheckbox">
                    Skip Reward Notfication Screen
            </label>
          </div>
          <div class={tw`flex gap-2 w-full justify-left pt-1`}>
            <input
                name="attemptOverrideDiscountCheckbox"
                type="checkbox"
                defaultChecked={attemptOverrideDiscount}
                checked={attemptOverrideDiscount}
                id="attemptOverrideDiscountCheckbox"
                onChange={(e) => { onChangeCheckboxHandler('attemptOverrideDiscount', e) }}
            />
            <label
                class="inline-block pl-[0.15rem] hover:cursor-pointer"
                for="attemptOverrideDiscountCheckbox">
                    Override Discount (if possible)
            </label>
          </div>
        </div>
        <div class={tw`${well} w-1/2`}>
            <h1 class={wellHeader}>Refunds</h1>
            <span class={inputSpan}>
                Checkout Reference ID<input
                class={input}
                type="string"
                onInput={onUpdateCheckoutReference}
                />
            </span>
            <span class={inputSpan}>
                Refund Amount<input
                class={input}
                type="number"
                onInput={onUpdateRefundAmount}
                />
            </span>
            <div class={tw`pt-4 w-full text-center`}>
                <Button
                onClick={onClickRefund}
                >Refund</Button>
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
          <div>Name: {selectedDiscount?.name}</div>
          <div>Point Cost: {selectedDiscount?.point_cost}</div>
          <div>ID: {selectedDiscount?.uid}</div>
          <div>Type: {selectedDiscount?.type}</div>

          <div class={tw`mt-5 flex justify-center gap-10`}>
            <Button onClick={() => setApprovedDiscount(selectedDiscount)}>
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
