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
        <link rel="stylesheet" href="https://lapple.github.io/react-json-inspector/json-inspector.css" />
      </Head>
      <App defaultConfig={defaultConfig} />
    </div>
  );
}
