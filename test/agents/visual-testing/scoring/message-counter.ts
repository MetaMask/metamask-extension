import type { AgentMessage, ToolCall } from '@metamask/agent-runner';
import type { MessageCounts } from '../types';

export function createMessageCounter(): {
  counts: MessageCounts;
  process: (message: AgentMessage) => void;
} {
  const counts: MessageCounts = {
    agentDecisionCount: 0,
    mmCommandCount: 0,
  };

  function process(message: AgentMessage): void {
    if (message.type === 'generation') {
      for (const toolCall of message.toolCalls) {
        counts.agentDecisionCount += 1;
        if (isMmBashCommand(toolCall)) {
          counts.mmCommandCount += 1;
        }
      }
    }
  }

  return { counts, process };
}

function isMmBashCommand(toolCall: ToolCall): boolean {
  if (typeof toolCall.input !== 'object' || toolCall.input === null) {
    return false;
  }
  const command = (toolCall.input as Record<string, unknown>).command;
  if (typeof command !== 'string') {
    return false;
  }
  return command.trimStart().startsWith('mm ') ||
    command.trimStart().startsWith('npx mm ') ||
    command.trimStart().startsWith('yarn mm ');
}
