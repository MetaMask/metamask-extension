import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  ProviderAdapter,
  AgentMessage,
  RunConfig,
  ToolCall,
  JudgeConfig,
} from '../provider-types';
import { extractTextContent, extractToolUseBlocks } from '../message-parser';

export function createClaudeAdapter(): ProviderAdapter {
  return {
    name: 'claude',
    async *run(config: RunConfig): AsyncIterable<AgentMessage> {
      for await (const message of query({
        prompt: config.prompt,
        options: {
          model: config.model,
          maxTurns: config.maxTurns,
          cwd: config.cwd,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          systemPrompt: config.systemPrompt,
          env: config.env,
          ...(config.verbose
            ? { stderr: (data: string) => process.stderr.write(data) }
            : {}),
        },
      })) {
        const translated = translateMessage(message, config.model);
        if (translated) yield translated;
      }
    },
  };
}

export function createClaudeJudge(model: string): JudgeConfig {
  return {
    model,
    async evaluate(prompt: string, maxTokens: number): Promise<string> {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic();
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0]?.type === 'text'
        ? response.content[0].text
        : '';
    },
  };
}

function translateMessage(
  message: Record<string, unknown>,
  defaultModel: string,
): AgentMessage | undefined {
  const type = message.type as string;

  switch (type) {
    case 'system': {
      if (
        'subtype' in message &&
        message.subtype === 'init' &&
        'session_id' in message
      ) {
        return {
          type: 'init',
          sessionId: message.session_id as string,
        };
      }
      return undefined;
    }

    case 'assistant': {
      const msg = message.message as Record<string, unknown> | undefined;
      if (!msg) return undefined;

      const usage = msg.usage as Record<string, number> | undefined;
      const textContent = extractTextContent(msg);
      const toolUses = extractToolUseBlocks(msg);

      return {
        type: 'generation',
        model: (msg.model as string) ?? defaultModel,
        text: textContent,
        toolCalls: toolUses as ToolCall[],
        usage: {
          inputTokens: usage?.input_tokens ?? 0,
          outputTokens: usage?.output_tokens ?? 0,
          cacheReadTokens: usage?.cache_read_input_tokens,
          cacheCreationTokens: usage?.cache_creation_input_tokens,
        },
        stopReason: (msg.stop_reason as string) ?? null,
      };
    }

    case 'user': {
      const msg = message.message as Record<string, unknown> | undefined;
      const content = msg?.content;
      if (!Array.isArray(content)) return undefined;

      for (const block of content) {
        if (
          typeof block === 'object' &&
          block !== null &&
          'type' in block &&
          block.type === 'tool_result' &&
          'tool_use_id' in block
        ) {
          let resultText: string;
          if ('content' in block && typeof block.content === 'string') {
            resultText = block.content;
          } else if ('content' in block && Array.isArray(block.content)) {
            resultText = (
              block.content as unknown as Array<Record<string, unknown>>
            )
              .filter(
                (b) => b.type === 'text' && typeof b.text === 'string',
              )
              .map((b) => b.text as string)
              .join('\n');
          } else {
            resultText = JSON.stringify(block);
          }

          return {
            type: 'tool_result',
            toolUseId: block.tool_use_id as string,
            content: resultText,
            isError: 'is_error' in block && block.is_error === true,
          };
        }
      }
      return undefined;
    }

    case 'result': {
      const subtype = message.subtype as string;
      return {
        type: 'result',
        success: subtype === 'success',
        result: message.result as string | undefined,
        costUsd: message.total_cost_usd as number | undefined,
        turns: message.num_turns as number | undefined,
        durationMs: message.duration_ms as number | undefined,
        error: subtype !== 'success' ? subtype : undefined,
      };
    }

    default:
      return undefined;
  }
}
