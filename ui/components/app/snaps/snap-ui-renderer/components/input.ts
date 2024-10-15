import { InputElement, NumberInputProps } from '@metamask/snaps-sdk/jsx';

import { hasProperty } from '@metamask/utils';
import { UIComponentFactory } from './types';

export const input: UIComponentFactory<InputElement> = ({ element, form }) => {
  const constructInputProps = (props: InputElement['props']) => {
    if (!hasProperty(props, 'type')) {
      return {
        textFieldProps: {
          type: 'text',
        },
      };
    }

    switch (props.type) {
      case 'number': {
        const { step, min, max, type } = props as NumberInputProps;

        return {
          textFieldProps: {
            type,
            inputProps: {
              step: step?.toString(),
              min: min?.toString(),
              max: max?.toString(),
            },
          },
        };
      }
      default:
        return {
          textFieldProps: {
            type: props.type,
          },
        };
    }
  };

  return {
    element: 'SnapUIInput',
    props: {
      id: element.props.name,
      placeholder: element.props.placeholder,
      ...constructInputProps(element.props),
    },
    name: element.props.name,
    form,
  };
};
