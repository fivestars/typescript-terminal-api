/** @jsx h */
import { tw } from "@twind";
import { h } from "preact";


export default function Modal(props: h.JSX.HTMLAttributes<HTMLDivElement>) {

    const container = tw`fixed top-0 left-0 right-0 bottom-0 z-50`
    const background = tw`fixed left-0 top-0 w-full h-full opacity-80 bg-gray-400`
    const content = tw`absolute p-10 z-20 top-1/2 left-1/2 -translate-1/2 bg-white rounded`

    return (
        <div class={container}>
            <div class={content}>
                {props.children}
            </div>
            <div class={background} />
        </div>
    )
}
