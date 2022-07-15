import { ConfigurationSchema } from '../types/config.ts'

export function validateConfig(config: ConfigurationSchema) {
    let valid = true;
    valid &&= Boolean(config.bearer_token)
    valid &&= Boolean(config.software_id)
    valid &&= Boolean(config.pos_id)
    valid &&= Boolean(config.base_url)
    valid &&= Boolean(config.terminal_id)
    return valid;
}

export default function readConfig(): ConfigurationSchema {
    return JSON.parse(Deno.readTextFileSync('config/default.json'))?.settings
}
