export type ToolCall = {
  id: string;
  name: string;
  input: unknown;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
};

export type AgentMessage =
  | { type: 'init'; sessionId: string }
  | {
      type: 'generation';
      model: string;
      text: string;
      toolCalls: ToolCall[];
      usage: TokenUsage;
      stopReason: string | null;
    }
  | {
      type: 'tool_result';
      toolUseId: string;
      content: string;
      isError: boolean;
    }
  | {
      type: 'result';
      success: boolean;
      result?: string;
      costUsd?: number;
      turns?: number;
      durationMs?: number;
      error?: string;
    };

export type RunConfig = {
  prompt: string;
  model: string;
  maxTurns: number;
  systemPrompt: string;
  cwd: string;
  env: Record<string, string | undefined>;
  verbose: boolean;
};

export type ProviderAdapter = {
  name: string;
  run(config: RunConfig): AsyncIterable<AgentMessage>;
};

export type JudgeConfig = {
  model: string;
  evaluate(prompt: string, maxTokens: number): Promise<string>;
};
