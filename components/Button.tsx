/** @jsx h */
import { tw } from "@twind";
import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useLogger } from '../terminal-api/logger.ts';
import TransactionRunner from '../terminal-api/transaction.ts';
import { ConfigurationSchema } from '../types/config.ts';
import { TransactionTypes } from "../types/transaction.ts";


export default function Button(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {

    const btn = tw`px-3 py-2 border(gray-100 1) bg-gray-100 hover:(border border-solid border-gray-400) rounded`
    const btnDisabled = tw`${btn} hover:cursor-not-allowed`

    return (
        <button
            {...props}
            class={props.disabled ? btnDisabled : btn}
        >{props.children}</button>
    )
}
