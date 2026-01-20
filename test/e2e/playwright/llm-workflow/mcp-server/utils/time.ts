let lastTimestampMs = 0;

export function generateFilesafeTimestamp(date: Date = new Date()): string {
  let timestampMs = date.getTime();
  if (timestampMs <= lastTimestampMs) {
    timestampMs = lastTimestampMs + 1;
  }
  lastTimestampMs = timestampMs;

  const normalized = new Date(timestampMs);
  const year = normalized.getFullYear().toString().padStart(4, '0');
  const month = (normalized.getMonth() + 1).toString().padStart(2, '0');
  const day = normalized.getDate().toString().padStart(2, '0');
  const hours = normalized.getHours().toString().padStart(2, '0');
  const minutes = normalized.getMinutes().toString().padStart(2, '0');
  const seconds = normalized.getSeconds().toString().padStart(2, '0');
  const milliseconds = normalized.getMilliseconds().toString().padStart(3, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
}

export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mm-${timestamp}-${random}`;
}
