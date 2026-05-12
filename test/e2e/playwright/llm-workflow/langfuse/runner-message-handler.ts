import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk' with { 'resolution-mode': 'import' };
import { extractTextContent, extractToolUseBlocks } from './message-parser';
import {
  type SpanHandle,
  traceSpan,
  createSessionSpan,
  setOtelAttrs,
} from './runner-tracing';

function formatToolLabel(toolName: string, input: unknown): string {
  if (toolName === 'Bash' && typeof input === 'object' && input !== null) {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd === 'string') {
      const short = cmd.split('\n')[0].trim().slice(0, 80);
      return `Bash: ${short}`;
    }
  }
  if (toolName === 'Read' && typeof input === 'object' && input !== null) {
    const file = (input as Record<string, unknown>).file_path;
    if (typeof file === 'string') {
      return `Read: ${file.split('/').pop()}`;
    }
  }
  if (toolName === 'Edit' && typeof input === 'object' && input !== null) {
    const file = (input as Record<string, unknown>).file_path;
    if (typeof file === 'string') {
      return `Edit: ${file.split('/').pop()}`;
    }
  }
  return `tool:${toolName}`;
}

export type RunnerConfig = {
  prompt: string;
  model: string;
  maxTurns: number;
  redact: boolean;
  verbose: boolean;
  userId: string;
  startTime: number;
  initialSessionId: string | undefined;
};

export type RunnerState = {
  totalInputTokens: number;
  totalOutputTokens: number;
  turns: number;
  finalResult: string | undefined;
  langfuseSessionId: string | undefined;
  sessionSpan: SpanHandle | undefined;
  lastTurnInput: string;
  traceId: string | undefined;
  conversationLog: string[];
  pendingTools: Map<string, { name: string; input: unknown; span: SpanHandle }>;
};

export function createInitialState(config: RunnerConfig): RunnerState {
  return {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    turns: 0,
    finalResult: undefined,
    langfuseSessionId: config.initialSessionId,
    sessionSpan: undefined,
    lastTurnInput: config.prompt,
    traceId: undefined,
    conversationLog: [`[USER PROMPT] ${config.prompt}`],
    pendingTools: new Map(),
  };
}

export function handleMessage(
  message: SDKMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  switch (message.type) {
    case 'system':
      handleSystemMessage(message, state, config);
      break;
    case 'assistant':
      handleAssistantMessage(message, state, config);
      break;
    case 'user':
      handleUserMessage(message, state, config);
      break;
    case 'result':
      handleResultMessage(message, state, config);
      break;
    default:
      break;
  }
}

export function finalizePendingTools(state: RunnerState): void {
  for (const [, pending] of state.pendingTools) {
    pending.span.update({ output: '[no result received]' });
    pending.span.end();
  }
  state.pendingTools.clear();
}

export function finalizeSessionSpan(state: RunnerState): void {
  if (!state.sessionSpan) return;
  state.sessionSpan.update({
    output: {
      status: state.finalResult ? 'completed' : 'failed',
      result: state.finalResult?.slice(0, 1000),
      totalInputTokens: state.totalInputTokens,
      totalOutputTokens: state.totalOutputTokens,
      turns: state.turns,
    },
  });
  state.sessionSpan.end();
}

function handleSystemMessage(
  message: SDKMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  if (!('subtype' in message) || message.subtype !== 'init') return;

  const claudeSessionId = message.session_id;
  if (!state.langfuseSessionId) {
    state.langfuseSessionId = claudeSessionId;
  }
  process.stderr.write(`[RUNNER] Claude session: ${claudeSessionId}\n`);
  process.stderr.write(
    `[RUNNER] Langfuse session: ${state.langfuseSessionId}\n`,
  );

  traceSpan(state.langfuseSessionId, config.userId, () => {
    const result = createSessionSpan(
      config.prompt,
      {
        model: config.model,
        maxTurns: config.maxTurns,
        claudeSessionId,
        langfuseSessionId: state.langfuseSessionId,
      },
      config.redact,
    );
    if (result) {
      state.sessionSpan = result.span;
      state.traceId = result.traceId;
    }
  });

  if (state.traceId) {
    process.stderr.write(`[RUNNER] Langfuse trace: ${state.traceId}\n`);
  }
}

function handleAssistantMessage(
  message: SDKMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  state.turns++;
  const msg = message as SDKMessage & {
    type: 'assistant';
    message: {
      model?: string;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
      };
      content?: unknown[];
      stop_reason?: string;
    };
  };

  const usage = msg.message?.usage;
  if (usage) {
    state.totalInputTokens += usage.input_tokens ?? 0;
    state.totalOutputTokens += usage.output_tokens ?? 0;
  }

  const textContent = extractTextContent(
    msg.message as unknown as Record<string, unknown>,
  );
  const toolUses = extractToolUseBlocks(
    msg.message as unknown as Record<string, unknown>,
  );

  if (textContent) {
    state.conversationLog.push(
      `[ASSISTANT turn ${state.turns}] ${textContent}`,
    );
    if (config.verbose) {
      process.stderr.write(`[CLAUDE] ${textContent}\n`);
    }
  }
  if (toolUses.length > 0) {
    state.conversationLog.push(
      `[TOOL CALLS turn ${state.turns}] ${toolUses.map((t) => `${t.name}(${JSON.stringify(t.input).slice(0, 200)})`).join(', ')}`,
    );
  }

  const modelName = msg.message?.model ?? config.model ?? 'unknown';

  traceSpan(state.langfuseSessionId, config.userId, () => {
    const parent = state.sessionSpan;
    if (!parent) return;

    const genSpan = parent.startObservation(
      modelName,
      {
        input: config.redact ? '[REDACTED]' : state.lastTurnInput,
        output: config.redact
          ? '[REDACTED]'
          : textContent || JSON.stringify(toolUses),
      },
      { asType: 'generation' },
    );

    setOtelAttrs(genSpan, {
      'langfuse.observation.model.name': modelName,
      ...(usage
        ? {
            'gen_ai.usage.input_tokens': usage.input_tokens ?? 0,
            'gen_ai.usage.output_tokens': usage.output_tokens ?? 0,
            ...(usage.cache_read_input_tokens
              ? {
                  'gen_ai.usage.cache_read_input_tokens':
                    usage.cache_read_input_tokens,
                }
              : {}),
            ...(usage.cache_creation_input_tokens
              ? {
                  'gen_ai.usage.cache_creation_input_tokens':
                    usage.cache_creation_input_tokens,
                }
              : {}),
          }
        : {}),
    });

    genSpan.end();

    for (const tool of toolUses) {
      if (!tool.id) continue;
      const toolLabel = formatToolLabel(tool.name, tool.input);
      const toolSpan = parent.startObservation(
        toolLabel,
        { input: config.redact ? '[REDACTED]' : tool.input },
        { asType: 'tool' },
      );
      state.pendingTools.set(tool.id, {
        name: tool.name,
        input: tool.input,
        span: toolSpan,
      });
    }
  });
}

function handleUserMessage(
  message: SDKMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  const userMsg = message as SDKMessage & {
    type: 'user';
    message: { content?: unknown[] | string };
  };
  const content = userMsg.message?.content;
  if (!Array.isArray(content)) return;

  for (const block of content) {
    if (
      typeof block !== 'object' ||
      block === null ||
      !('type' in block) ||
      block.type !== 'tool_result' ||
      !('tool_use_id' in block)
    ) {
      continue;
    }

    const toolUseId = block.tool_use_id as string;
    const pending = state.pendingTools.get(toolUseId);
    if (!pending) continue;

    let resultText: string;
    if ('content' in block && typeof block.content === 'string') {
      resultText = block.content;
    } else if ('content' in block && Array.isArray(block.content)) {
      resultText = (
        block.content as unknown as Array<Record<string, unknown>>
      )
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text as string)
        .join('\n');
    } else {
      resultText = JSON.stringify(block);
    }

    const truncated =
      resultText.length > 4000
        ? `${resultText.slice(0, 4000)}... [truncated ${resultText.length} chars]`
        : resultText;

    pending.span.update({
      output: config.redact ? '[REDACTED]' : truncated,
      level: 'is_error' in block && block.is_error ? 'ERROR' : 'DEFAULT',
    });
    pending.span.end();
    state.pendingTools.delete(toolUseId);

    state.lastTurnInput = `[${pending.name} result] ${truncated.slice(0, 2000)}`;
    state.conversationLog.push(
      `[TOOL RESULT ${pending.name}] ${truncated.slice(0, 500)}`,
    );
  }
}

function handleResultMessage(
  message: SDKMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  const result = message as SDKMessage & {
    type: 'result';
    subtype: string;
    result?: string;
    total_cost_usd?: number;
    num_turns?: number;
    duration_ms?: number;
  };

  if (result.subtype === 'success') {
    state.finalResult = result.result;
    const durationSec = (
      (result.duration_ms ?? Date.now() - config.startTime) / 1000
    ).toFixed(1);
    process.stderr.write('\n─────────────────────────────────────\n');
    process.stderr.write(`[RUNNER] ✓ Completed in ${durationSec}s\n`);
    process.stderr.write(
      `[RUNNER] Turns: ${result.num_turns ?? state.turns}\n`,
    );
    process.stderr.write(
      `[RUNNER] Tokens: ${state.totalInputTokens} in / ${state.totalOutputTokens} out\n`,
    );
    if (result.total_cost_usd !== undefined) {
      process.stderr.write(
        `[RUNNER] Cost: $${result.total_cost_usd.toFixed(4)}\n`,
      );
    }
    process.stderr.write('─────────────────────────────────────\n\n');
    if (state.finalResult) {
      process.stdout.write(state.finalResult + '\n');
    }
  } else {
    process.stderr.write(`[RUNNER] ✗ Failed: ${result.subtype}\n`);
    if (result.result) {
      process.stderr.write(`[RUNNER] Error: ${result.result}\n`);
    }
    process.exitCode = 1;
  }
}
