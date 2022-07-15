import { ConfigurationSchema } from '../types/config.ts'

export default function readConfig(): ConfigurationSchema {
    return JSON.parse(Deno.readTextFileSync('config/default.json'))?.settings
}