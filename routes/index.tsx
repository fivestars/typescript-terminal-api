/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import App from "../islands/App.tsx";
import readConfig from '../config/index.ts'

export default function Home() {
  const defaultConfig = readConfig()
  return (
    <div class={tw`p-4 mx-auto max-w-screen-lg`}>
      {/* <img
        src="/logo.svg"
        height="100px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <p class={tw`my-6`}>
        Welcome to `fresh`. Try update this message in the ./routes/index.tsx
        file, and refresh.
      </p> */}
      <App defaultConfig={defaultConfig} />
    </div>
  );
}
