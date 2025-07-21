import { ChangeEvent as ReactChangeEvent } from 'react';
import { JSXElement, SnapsChildren } from '@metamask/snaps-sdk/jsx';
import type { COMPONENT_MAPPING } from '.';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type UIComponentParams<T extends JSXElement> = {
  map: Record<string, number>;
  element: T;
  form?: string;
  useFooter?: boolean;
  onCancel?: () => void;
  promptLegacyProps?: {
    onInputChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
    inputValue: string;
    placeholder?: string;
  };
  t: (key: string) => string;
  contentBackgroundColor: string | undefined;
  componentMap: COMPONENT_MAPPING;
};

export type UIComponent = {
  element: string;
  props?: Record<string, unknown>;
  children?: SnapsChildren<UIComponent | string>;
  key?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type UIComponentFactory<T extends JSXElement> = (
  params: UIComponentParams<T>,
) => UIComponent;
