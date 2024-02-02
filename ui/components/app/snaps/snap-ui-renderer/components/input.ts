import { Input } from '@metamask/snaps-sdk';
import { ChangeEvent } from 'react';
import { UiComponent } from './types';

export const input: UiComponent<Input> = ({
  element,
  state,
  parentForm,
  handleEvent,
}) => ({
  element: 'FormTextField',
  props: {
    className: 'snap-ui-renderer__input',
    marginBottom: 1,
    value: parentForm
      ? // @ts-expect-error wtf
        state?.[parentForm]?.[element.name] ?? ''
      : state?.[element.name] ?? '',
    label: element.label,
    id: element.name,
    placeholder: element.placeholder,
    type: element.inputType,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      handleEvent({
        componentName: element.name,
        parentForm,
        value: event.target.value,
      }),
  },
});
