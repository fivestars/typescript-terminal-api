/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import App from "../islands/App.tsx";
import readConfig from '../config/index.ts'
import { Head } from "$fresh/runtime.ts"

export default function Home() {
  const defaultConfig = readConfig()
  return (
    <div class={tw`p-4 mx-auto max-w-screen-lg`}>
      <Head>
        <link rel="stylesheet" href="https://esm.sh/react-json-view-lite/dist/index.css" />
      </Head>
      <App defaultConfig={defaultConfig} />
    </div>
  );
}
