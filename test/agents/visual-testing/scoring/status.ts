import type { AgentRunResult, AssertionResult, TerminalStatus } from '../types';

export function determineStatus(
  runResult: AgentRunResult,
  assertion: AssertionResult,
): TerminalStatus {
  if (runResult.error) {
    const errorMsg = runResult.error.message.toLowerCase();

    if (errorMsg.includes('max turns') || errorMsg.includes('wallclock')) {
      return 'failed_guardrail';
    }
    if (errorMsg.includes('tool') || errorMsg.includes('bash')) {
      return 'failed_tool';
    }
    return 'failed_agent';
  }

  if (!assertion.passed) {
    return 'failed_assertion';
  }

  return 'success';
}
