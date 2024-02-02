import { Form, UserInputEventType } from '@metamask/snaps-sdk';
import { FormEvent } from 'react';
import { mapToTemplate } from '../snap-ui-renderer';
import { UiComponent } from './types';

export const form: UiComponent<Form> = ({
  element,
  handleEvent,
  state,
  ...params
}) => ({
  element: 'form',
  children: element.children.map((children) =>
    // eslint-disable-next-line no-use-before-define
    mapToTemplate({
      ...params,
      handleEvent,
      state,
      element: children,
      parentForm: element.name,
    }),
  ),
  props: {
    className: 'snap-ui-renderer__form',
    onSubmit: (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      handleEvent({
        eventType: UserInputEventType.FormSubmitEvent,
        componentName: element.name,
        value: state[element.name] ?? null,
      });
    },
  },
});
