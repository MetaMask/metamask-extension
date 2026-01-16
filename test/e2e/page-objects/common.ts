export type RawLocator =
  | string
  | { css?: string; text?: string }
  | { tag: string; text: string }
  | { tag: string; testId: string };
