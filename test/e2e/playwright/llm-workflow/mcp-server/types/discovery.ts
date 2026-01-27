export const ACTIONABLE_ROLES = [
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'combobox',
  'menuitem',
] as const;

export const IMPORTANT_ROLES = [
  'dialog',
  'alert',
  'status',
  'heading',
] as const;

export const INCLUDED_ROLES = [
  ...ACTIONABLE_ROLES,
  ...IMPORTANT_ROLES,
] as const;

export type ActionableRole = (typeof ACTIONABLE_ROLES)[number];
export type ImportantRole = (typeof IMPORTANT_ROLES)[number];
export type IncludedRole = (typeof INCLUDED_ROLES)[number];

export type TestIdItem = {
  testId: string;
  tag: string;
  text?: string;
  visible: boolean;
};

export type A11yNodeTrimmed = {
  ref: string;
  role: string;
  name: string;
  disabled?: boolean;
  checked?: boolean;
  expanded?: boolean;
  path: string[];
};

export type RawA11yNode = {
  role: string;
  name?: string;
  disabled?: boolean;
  checked?: boolean | 'mixed';
  expanded?: boolean;
  children?: RawA11yNode[];
};
