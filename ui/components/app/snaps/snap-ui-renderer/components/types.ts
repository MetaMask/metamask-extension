import { Component } from '@metamask/snaps-sdk';

export type UIComponentParams<T extends Component> = {
  map: Record<string, number>;
  element: T;
  root?: boolean;
  form?: string;
};

export type UIComponent = {
  element: string;
  props?: Record<string, unknown>;
  children?: UIComponent[] | string;
  key?: string;
};

export type UIComponentFactory<T extends Component> = (
  params: UIComponentParams<T>,
) => UIComponent;
