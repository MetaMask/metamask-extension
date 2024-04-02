import { Input } from '@metamask/snaps-sdk';

import { UIComponentFactory } from './types';

export const input: UIComponentFactory<Input> = ({ element, form }) => ({
  element: 'SnapUIInput',
  props: {
    id: element.name,
    placeholder: element.placeholder,
    label: element.label,
    textFieldProps: {
      type: element.inputType,
    },
    name: element.name,
    form,
    error: element.error !== undefined,
    helpText: element.error,
  },
});
