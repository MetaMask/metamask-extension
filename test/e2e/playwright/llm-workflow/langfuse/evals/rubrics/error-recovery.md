## Error Recovery Criteria

Evaluate how the agent handles errors during execution:

- When a click/type failed (element not found, timeout), did the agent try a different approach or keep retrying the same action?
- Did the agent call describe-screen to reassess after an error?
- Did the agent recognize when it was stuck in a loop and change strategy?
- Did the agent provide useful error context when reporting failures?
- Penalize: retrying the exact same action more than twice without changing approach
