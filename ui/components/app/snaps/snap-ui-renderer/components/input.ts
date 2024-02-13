import { Input } from '@metamask/snaps-sdk';

import { UIComponentFactory } from './types';

export const input: UIComponentFactory<Input> = ({ element, form }) => ({
  element: 'SnapUIInput',
  props: {
    id: element.name,
    placeholder: element.placeholder,
    textFieldProps: {
      type: element.inputType,
    },
    name: element.name,
    form,
  },
});
