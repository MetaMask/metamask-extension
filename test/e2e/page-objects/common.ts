export type RawLocator =
  | string
  | { css?: string; text?: string }
  | { tag: string; text: string };

export enum ACCOUNT_TYPE {
  ETHEREUM,
  BITCOIN,
  SOLANA,
}
