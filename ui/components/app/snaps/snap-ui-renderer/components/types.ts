import { Component, SnapId, UserInputEventTypes } from '@metamask/snaps-sdk';

export type UIComponentParams<T extends Component> = {
  element: T;
  elementKeyIndex: {
    value: number;
  };
  snapId: SnapId;
  parentForm: string;
  // @TODO: export ComponentState type
  state: Record<string, string | Record<string, string>>;
  handleEvent: ({
    eventType,
    componentName,
    parentForm,
    value,
  }: {
    eventType: UserInputEventTypes | 'stateChange';
    componentName?: string;
    parentForm?: string;
    value?: Record<string, string> | string;
  }) => void;
};

export type UiComponent<T extends Component> = (
  params: UIComponentParams<T>,
) => {
  element: string;
  props?: Record<string, unknown>;
  children?: UiComponent<any> | UiComponent<any>[] | string;
};
