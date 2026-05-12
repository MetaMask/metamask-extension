export function extractToolCalls(log: string[]): string[] {
  const calls: string[] = [];
  for (const entry of log) {
    if (!entry.startsWith('[TOOL CALLS')) continue;
    const matches = entry.matchAll(/(\w+)\(([^)]*)\)/g);
    for (const m of matches) {
      const name = m[1];
      const argSnippet = m[2];
      const cmdMatch = /"command"\s*:\s*"([^"]+)"/.exec(argSnippet);
      calls.push(cmdMatch ? `${name}:${cmdMatch[1]}` : name);
    }
  }
  return calls;
}

export function extractToolResults(
  log: string[],
): Array<{ tool: string; isError: boolean }> {
  const results: Array<{ tool: string; isError: boolean }> = [];
  for (const entry of log) {
    if (!entry.startsWith('[TOOL RESULT')) continue;
    const toolMatch = /\[TOOL RESULT (\w+)\]/.exec(entry);
    if (!toolMatch) continue;
    const hasError =
      entry.includes('MM_TARGET_NOT_FOUND') ||
      entry.includes('MM_CLICK_FAILED') ||
      entry.includes('MM_WAIT_TIMEOUT') ||
      entry.includes('"ok":false') ||
      entry.includes('"ok": false');
    results.push({ tool: toolMatch[1], isError: hasError });
  }
  return results;
}
