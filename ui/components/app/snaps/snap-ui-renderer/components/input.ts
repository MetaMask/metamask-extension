import { InputElement } from '@metamask/snaps-sdk/jsx';

import { UIComponentFactory } from './types';

export const input: UIComponentFactory<InputElement> = ({ element, form }) => ({
  element: 'SnapUIInput',
  props: {
    id: element.props.name,
    placeholder: element.props.placeholder,
    textFieldProps: {
      type: element.props.type,
      inputProps: {
        step: element.props.step,
        min: element.props.min,
        max: element.props.max,
      },
    },
    name: element.props.name,
    form,
  },
});
