export const SENSITIVE_FIELD_PATTERNS = [
  /password/iu,
  /seed/iu,
  /srp/iu,
  /phrase/iu,
  /mnemonic/iu,
  /private.*key/iu,
  /secret/iu,
  /api[-_]?key/iu,
] as const;

export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}
