import { describe, expect, test } from 'bun:test'
import {
  chunkToAnthropicStyleEvents,
  normalizeOpenAIBaseUrl,
  toOpenAIChatMessages,
} from '../openai.js'

describe('normalizeOpenAIBaseUrl', () => {
  test('adds /v1 when missing', () => {
    expect(normalizeOpenAIBaseUrl('https://api.openai.com')).toBe(
      'https://api.openai.com/v1',
    )
  })

  test('preserves existing /v1', () => {
    expect(normalizeOpenAIBaseUrl('https://api.openai.com/v1')).toBe(
      'https://api.openai.com/v1',
    )
  })

  test('trims trailing slash before preserving /v1', () => {
    expect(normalizeOpenAIBaseUrl('https://example.com/v1/')).toBe(
      'https://example.com/v1',
    )
  })
})

describe('toOpenAIChatMessages', () => {
  test('maps system prompt, assistant tool_use, and user tool_result', () => {
    const messages = toOpenAIChatMessages({
      system: [{ text: 'You are helpful.' }],
      messages: [
        {
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Calling tool' },
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'bash',
                input: { command: 'pwd' },
              },
            ],
          },
        },
        {
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: [{ type: 'text', text: '/tmp/project' }],
              },
            ],
          },
        },
      ],
    })

    expect(messages).toEqual([
      {
        role: 'system',
        content: 'You are helpful.',
      },
      {
        role: 'assistant',
        content: 'Calling tool',
        tool_calls: [
          {
            id: 'tool-1',
            type: 'function',
            function: {
              name: 'bash',
              arguments: JSON.stringify({ command: 'pwd' }),
            },
          },
        ],
      },
      {
        role: 'tool',
        tool_call_id: 'tool-1',
        content: '/tmp/project',
      },
    ])
  })
})

describe('chunkToAnthropicStyleEvents', () => {
  test('maps text chunk to message_start and text delta events', () => {
    const events = chunkToAnthropicStyleEvents({
      chunk: {
        id: 'resp-1',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello' },
            finish_reason: null,
          },
        ],
      },
      hasStarted: false,
      hasTextBlockStarted: false,
    })

    expect(events).toEqual([
      {
        type: 'message_start',
        message: {
          id: 'resp-1',
          model: 'gpt-4o',
          role: 'assistant',
          content: [],
          usage: {
            input_tokens: 0,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: '',
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: 'Hello',
        },
      },
    ])
  })

  test('maps tool call chunk to tool_use events', () => {
    const events = chunkToAnthropicStyleEvents({
      chunk: {
        id: 'resp-2',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_1',
                  function: {
                    name: 'bash',
                    arguments: '{"command":"pwd"}',
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      },
      hasStarted: true,
      hasTextBlockStarted: false,
    })

    expect(events).toEqual([
      {
        type: 'content_block_start',
        index: 1,
        content_block: {
          type: 'tool_use',
          id: 'call_1',
          name: 'bash',
          input: '',
        },
      },
      {
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: '{"command":"pwd"}',
        },
      },
    ])
  })
})
