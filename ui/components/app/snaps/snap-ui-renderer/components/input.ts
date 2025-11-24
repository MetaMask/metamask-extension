import { InputElement, NumberInputProps } from '@metamask/snaps-sdk/jsx';

import { hasProperty } from '@metamask/utils';
import { UIComponentFactory } from './types';

export const constructInputProps = (props: InputElement['props']) => {
  if (!hasProperty(props, 'type')) {
    return {
      type: 'text',
      textFieldProps: {
        type: 'text',
      },
    };
  }

  switch (props.type) {
    case 'number': {
      const { step, min, max, type } = props as NumberInputProps;

      return {
        type,
        step,
        min,
        max,
        textFieldProps: {
          type: 'text',
        },
      };
    }
    default:
      return {
        type: props.type,
        textFieldProps: {
          type: props.type,
        },
      };
  }
};

export const input: UIComponentFactory<InputElement> = ({ element, form }) => {
  return {
    element: 'SnapUIInput',
    props: {
      id: element.props.name,
      placeholder: element.props.placeholder,
      disabled: element.props.disabled,
      ...constructInputProps(element.props),
      name: element.props.name,
      form,
    },
  };
};
