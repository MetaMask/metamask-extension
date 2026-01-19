// Format: 20260115T123456.789Z
export function generateFilesafeTimestamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/[-:]/gu, '')
    .replace(
      /\.\d{3}Z$/u,
      `.${String(date.getMilliseconds()).padStart(3, '0')}Z`,
    );
}

// Format: mm-{base36-timestamp}-{random}
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mm-${timestamp}-${random}`;
}
