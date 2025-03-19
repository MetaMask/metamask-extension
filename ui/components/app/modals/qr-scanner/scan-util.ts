export function parseScanContent(content: string): string | null {
  const matches = content.match(/^[a-zA-Z]+:(0x[0-9a-fA-F]{40})(?:@.*)?/u);
  if (!matches) {
    return null;
  }
  return matches[1];
}
