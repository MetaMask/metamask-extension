export type EvalScore = {
  name: string;
  value: number;
  comment: string;
};

export type EvalContext = {
  conversationLog: string[];
  turns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  toolCalls: string[];
  toolResults: Array<{ tool: string; isError: boolean }>;
};
