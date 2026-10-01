#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    port: { type: 'string', short: 'p', default: '3300' },
    host: { type: 'string', default: '127.0.0.1' },
    'no-open': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  }
})

if (values.help) {
  console.log(`Usage: claude-usage-analytics [options]

Options:
  -p, --port <port>  Port to listen on (default: 3300)
      --host <host>  Host to bind (default: 127.0.0.1)
      --no-open      Don't open the browser
  -h, --help         Show this help`)
  process.exit(0)
}

const serverEntry = fileURLToPath(new URL('../.output/server/index.mjs', import.meta.url))
if (!existsSync(serverEntry)) {
  console.error('Build output not found. Run `npm run build` first.')
  process.exit(1)
}

// Nitro's node-server preset reads these on import and starts listening.
process.env.PORT = values.port
process.env.HOST = values.host
await import(pathToFileURL(serverEntry).href)

const url = `http://${values.host}:${values.port}/`
console.log(`Claude Code Usage Analytics → ${url}`)

if (!values['no-open']) {
  const [cmd, args] = process.platform === 'win32'
    ? ['cmd', ['/c', 'start', '', url]]
    : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]]
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
}
