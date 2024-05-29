import { InputElement } from '@metamask/snaps-sdk/jsx';

import { UIComponentFactory } from './types';

export const input: UIComponentFactory<InputElement> = ({ element, form }) => ({
  element: 'SnapUIInput',
  props: {
    id: element.props.name,
    placeholder: element.props.placeholder,
    textFieldProps: {
      type: element.props.type,
    },
    name: element.props.name,
    form,
  },
});
