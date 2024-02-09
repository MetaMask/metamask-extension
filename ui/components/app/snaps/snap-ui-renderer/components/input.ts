import { Input } from '@metamask/snaps-sdk';

import { UIComponentFactory } from './types';

export const input: UIComponentFactory<Input> = ({ element }) => ({
  element: 'SnapUIInput',
  props: {
    id: element.name,
    placeholder: element.placeholder,
    type: element.inputType,
    textFieldProps: {
      type: element.type,
    },
  },
});
