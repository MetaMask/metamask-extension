import {
  Component,
  InterfaceState,
  SnapId,
  UserInputEventType,
} from '@metamask/snaps-sdk';

export type UIComponentParams<T extends Component> = {
  element: T;
  elementKeyIndex: {
    value: number;
  };
  snapId: SnapId;
  parentForm: string;
  state: InterfaceState;
  handleEvent: ({
    eventType,
    componentName,
    parentForm,
    value,
  }: {
    eventType?: UserInputEventType;
    componentName?: string;
    parentForm?: string;
    value?: Record<string, string | null> | string | null;
  }) => void;
};

export type UIComponent<T extends Component> = (
  params: UIComponentParams<T>,
) => {
  element: string;
  props?: Record<string, unknown>;
  children?: UIComponent<any> | UIComponent<any>[] | string;
};
