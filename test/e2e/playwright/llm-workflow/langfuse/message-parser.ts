export function extractTextContent(message: Record<string, unknown>): string {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block
    ) {
      parts.push(block.text as string);
    }
  }
  return parts.join('\n');
}

export function extractToolUseBlocks(
  message: Record<string, unknown>,
): Array<{ id: string; name: string; input: unknown }> {
  const content = message?.content;
  if (!Array.isArray(content)) return [];
  const tools: Array<{ id: string; name: string; input: unknown }> = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'tool_use' &&
      'name' in block &&
      'id' in block
    ) {
      tools.push({
        id: block.id as string,
        name: block.name as string,
        input: 'input' in block ? block.input : undefined,
      });
    }
  }
  return tools;
}
