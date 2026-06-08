/**
 * Command Code HTTP client.
 *
 * Handles:
 * - NDJSON streaming requests to the CC API
 * - Session management (per-API-key UUID with TTL)
 * - Dynamic version tracking (fetches latest command-code npm version)
 * - Custom headers to mimic the real CLI
 */

import { randomUUID } from 'crypto'
import { logForDebugging } from 'src/utils/debug.js'
import { getProxyFetchOptions } from 'src/utils/proxy.js'
import type { CommandCodeRequest } from './convertRequest.js'

const DEFAULT_BASE_URL = 'https://api.commandcode.ai'
const GENERATE_ENDPOINT = '/alpha/generate'

// Session management
interface SessionEntry {
  id: string
  createdAt: number
  expiresAt: number
}

const sessions = new Map<string, SessionEntry>()
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours
const SESSION_JITTER_MS = 60 * 60 * 1000 // 1 hour jitter

// Version tracking
let cachedVersion = '0.32.3' // fallback
let versionLastFetched = 0
const VERSION_REFRESH_MS = 24 * 60 * 60 * 1000 // 24 hours

function getBaseUrl(): string {
  return (process.env.COMMANDCODE_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/+$/,
    '',
  )
}

function getApiKey(): string {
  return process.env.COMMANDCODE_API_KEY || ''
}

function getProjectSlug(): string {
  return process.env.COMMANDCODE_PROJECT_SLUG || 'claude-code'
}

/**
 * Get or create a session ID for the given API key.
 */
function getSessionId(apiKey: string): string {
  const now = Date.now()
  const existing = sessions.get(apiKey)

  if (existing && now < existing.expiresAt) {
    return existing.id
  }

  // Create new session
  const jitter = Math.random() * SESSION_JITTER_MS
  const session: SessionEntry = {
    id: randomUUID(),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS + jitter,
  }
  sessions.set(apiKey, session)
  return session.id
}

/**
 * Fetch the latest command-code npm package version.
 */
async function fetchLatestVersion(): Promise<string> {
  try {
    const response = await fetch(
      'https://registry.npmjs.org/command-code/latest',
      { signal: AbortSignal.timeout(5000) },
    )
    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>
      if (typeof data.version === 'string') {
        return data.version
      }
    }
  } catch {
    // Fall through to cached version
  }
  return cachedVersion
}

/**
 * Get the current CC CLI version string, refreshing if needed.
 */
async function getCCVersion(): Promise<string> {
  const now = Date.now()
  if (now - versionLastFetched > VERSION_REFRESH_MS) {
    cachedVersion = await fetchLatestVersion()
    versionLastFetched = now
  }
  return cachedVersion
}

function generateTraceparent(): string {
  const traceId = randomUUID().replace(/-/g, '')
  const spanId = randomUUID().replace(/-/g, '').slice(0, 16)
  return `00-${traceId}-${spanId}-01`
}

/**
 * Send a request to the Command Code API and return the NDJSON response stream.
 */
export async function streamCommandCodeRequest(params: {
  body: CommandCodeRequest
  signal: AbortSignal
  fetchOverride?: typeof fetch
}): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'COMMANDCODE_API_KEY is not set. Configure it via /login or set the environment variable.',
    )
  }

  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${GENERATE_ENDPOINT}`
  const sessionId = getSessionId(apiKey)
  const ccVersion = await getCCVersion()

  const fetchImpl = params.fetchOverride ?? fetch

  logForDebugging(
    `[CommandCode] POST ${url}, model=${params.body.params.model}, messages=${params.body.params.messages.length}, tools=${params.body.params.tools?.length ?? 0}`,
  )

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-cli-environment': 'production',
      'x-command-code-version': ccVersion,
      'x-session-id': sessionId,
      'x-co-flag': 'false',
      'x-taste-learning': 'false',
      'x-project-slug': getProjectSlug(),
      traceparent: generateTraceparent(),
    },
    body: JSON.stringify(params.body),
    signal: params.signal,
    ...getProxyFetchOptions({ forAnthropicAPI: false }),
  })

  logForDebugging(
    `[CommandCode] Response: status=${response.status}, contentType=${response.headers.get('content-type')}, hasBody=${!!response.body}`,
  )

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    logForDebugging(`[CommandCode] Error body: ${errorBody.slice(0, 500)}`)
    const message = mapErrorMessage(response.status, errorBody)
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error('Command Code API returned no response body')
  }

  return response.body
}

/**
 * Map CC HTTP error to a human-readable message.
 */
function mapErrorMessage(status: number, body: string): string {
  let detail = ''
  if (body) {
    try {
      const parsed = JSON.parse(body)
      detail = parsed.error?.message || parsed.message || ''
    } catch {
      detail = body.slice(0, 200)
    }
  }

  switch (status) {
    case 401:
    case 403:
      return `Command Code authentication error (${status}): ${detail || 'Invalid API key'}`
    case 429:
      return `Command Code rate limit exceeded: ${detail || 'Too many requests'}`
    case 402:
      return `Command Code payment required: ${detail || 'Insufficient credits'}`
    case 500:
    case 502:
    case 503:
      return `Command Code server error (${status}): ${detail || 'Service unavailable'}`
    default:
      return `Command Code API error (${status}): ${detail || 'Unknown error'}`
  }
}

/**
 * Clear the session cache (for testing or logout).
 */
export function clearCommandCodeSessionCache(): void {
  sessions.clear()
  versionLastFetched = 0
}
