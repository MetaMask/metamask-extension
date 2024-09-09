export function parseScanContent(content:any): string{
  return content.match(/.*:(0x[0-9a-fA-F]{40})(?:@.*)?/)[1]
}