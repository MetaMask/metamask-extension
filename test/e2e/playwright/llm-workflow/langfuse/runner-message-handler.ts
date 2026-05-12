import type { AgentMessage } from './provider-types';
import { redactSensitive } from './message-parser';
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
  message: AgentMessage,
  state: RunnerState,
  config: RunnerConfig,
): void {
  switch (message.type) {
    case 'init':
      handleInit(message, state, config);
      break;
    case 'generation':
      handleGeneration(message, state, config);
      break;
    case 'tool_result':
      handleToolResult(message, state, config);
      break;
    case 'result':
      handleResult(message, state, config);
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

function handleInit(
  message: AgentMessage & { type: 'init' },
  state: RunnerState,
  config: RunnerConfig,
): void {
  if (!state.langfuseSessionId) {
    state.langfuseSessionId = message.sessionId;
  }
  process.stderr.write(`[RUNNER] Agent session: ${message.sessionId}\n`);
  process.stderr.write(
    `[RUNNER] Langfuse session: ${state.langfuseSessionId}\n`,
  );

  traceSpan(state.langfuseSessionId, config.userId, () => {
    const result = createSessionSpan(
      config.prompt,
      {
        model: config.model,
        maxTurns: config.maxTurns,
        agentSessionId: message.sessionId,
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

function handleGeneration(
  message: AgentMessage & { type: 'generation' },
  state: RunnerState,
  config: RunnerConfig,
): void {
  state.turns++;
  state.totalInputTokens += message.usage.inputTokens;
  state.totalOutputTokens += message.usage.outputTokens;

  if (message.text) {
    state.conversationLog.push(
      `[ASSISTANT turn ${state.turns}] ${message.text}`,
    );
    if (config.verbose) {
      process.stderr.write(`[AGENT] ${message.text}\n`);
    }
  }
  if (message.toolCalls.length > 0) {
    state.conversationLog.push(
      `[TOOL CALLS turn ${state.turns}] ${message.toolCalls.map((t) => `${t.name}(${JSON.stringify(t.input).slice(0, 200)})`).join(', ')}`,
    );
  }

  traceSpan(state.langfuseSessionId, config.userId, () => {
    const parent = state.sessionSpan;
    if (!parent) return;

    const genSpan = parent.startObservation(
      message.model,
      {
        input: config.redact ? '[REDACTED]' : state.lastTurnInput,
        output: config.redact
          ? '[REDACTED]'
          : message.text || JSON.stringify(message.toolCalls),
      },
      { asType: 'generation' },
    );

    setOtelAttrs(genSpan, {
      'langfuse.observation.model.name': message.model,
      'gen_ai.usage.input_tokens': message.usage.inputTokens,
      'gen_ai.usage.output_tokens': message.usage.outputTokens,
      ...(message.usage.cacheReadTokens
        ? {
            'gen_ai.usage.cache_read_input_tokens':
              message.usage.cacheReadTokens,
          }
        : {}),
      ...(message.usage.cacheCreationTokens
        ? {
            'gen_ai.usage.cache_creation_input_tokens':
              message.usage.cacheCreationTokens,
          }
        : {}),
    });

    genSpan.end();

    for (const tool of message.toolCalls) {
      if (!tool.id) continue;
      const toolLabel = formatToolLabel(tool.name, tool.input);
      const toolSpan = parent.startObservation(
        toolLabel,
        { input: config.redact ? '[REDACTED]' : redactSensitive(tool.input) },
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

function handleToolResult(
  message: AgentMessage & { type: 'tool_result' },
  state: RunnerState,
  config: RunnerConfig,
): void {
  const pending = state.pendingTools.get(message.toolUseId);
  if (!pending) return;

  const truncated =
    message.content.length > 4000
      ? `${message.content.slice(0, 4000)}... [truncated ${message.content.length} chars]`
      : message.content;

  pending.span.update({
    output: config.redact ? '[REDACTED]' : truncated,
    level: message.isError ? 'ERROR' : 'DEFAULT',
  });
  pending.span.end();
  state.pendingTools.delete(message.toolUseId);

  state.lastTurnInput = `[${pending.name} result] ${truncated.slice(0, 2000)}`;
  state.conversationLog.push(
    `[TOOL RESULT ${pending.name}] ${truncated.slice(0, 500)}`,
  );
}

function handleResult(
  message: AgentMessage & { type: 'result' },
  state: RunnerState,
  config: RunnerConfig,
): void {
  if (message.success) {
    state.finalResult = message.result;
    const durationSec = (
      (message.durationMs ?? Date.now() - config.startTime) / 1000
    ).toFixed(1);
    process.stderr.write('\n─────────────────────────────────────\n');
    process.stderr.write(`[RUNNER] ✓ Completed in ${durationSec}s\n`);
    process.stderr.write(
      `[RUNNER] Turns: ${message.turns ?? state.turns}\n`,
    );
    process.stderr.write(
      `[RUNNER] Tokens: ${state.totalInputTokens} in / ${state.totalOutputTokens} out\n`,
    );
    if (message.costUsd !== undefined) {
      process.stderr.write(
        `[RUNNER] Cost: $${message.costUsd.toFixed(4)}\n`,
      );
    }
    process.stderr.write('─────────────────────────────────────\n\n');
    if (state.finalResult) {
      process.stdout.write(state.finalResult + '\n');
    }
  } else {
    process.stderr.write(
      `[RUNNER] ✗ Failed: ${message.error ?? 'unknown'}\n`,
    );
    if (message.result) {
      process.stderr.write(`[RUNNER] Error: ${message.result}\n`);
    }
    process.exitCode = 1;
  }
}
