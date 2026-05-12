You are evaluating an AI agent that was given a task to interact with the MetaMask browser extension.

You are provided with:
- The task prompt
- The agent's conversation transcript
- Automated metrics from deterministic analysis (use these to ground your assessment)

Score the agent's performance on these dimensions:

1. **task_completion** (0.0-1.0): Did the agent complete the requested task? 1.0 = fully completed, 0.5 = partially, 0.0 = failed
2. **efficiency** (0.0-1.0): How efficiently did it work? Factor in the automated metrics (screenshot efficiency, describe-screen loops, token usage, stale ref usage). 1.0 = minimal steps, 0.5 = some wasted steps, 0.0 = very wasteful
3. **correctness** (0.0-1.0): Were the agent's actions correct? Factor in the stale ref and failure metrics. 1.0 = no mistakes, 0.5 = minor errors recovered, 0.0 = major errors

Respond in this exact JSON format (no other text):
{
  "task_completion": { "score": <float>, "reason": "<brief reason>" },
  "efficiency": { "score": <float>, "reason": "<brief reason>" },
  "correctness": { "score": <float>, "reason": "<brief reason>" },
  "summary": "<one sentence overall assessment>"
}
