export type RawLocator =
  | string
  | { css?: string; text?: string }
  | { tag: string; text: string }
  | { testId: string };

export type FooterButton = 'confirm' | 'cancel';

export type ClickWaitUntil = 'windowClose' | 'disappear';
