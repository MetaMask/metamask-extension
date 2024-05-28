import {
  FieldElement,
  InputElement,
  ButtonElement,
} from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { button as buttonMapper } from './button';

import { UIComponentFactory, UIComponentParams } from './types';

export const field: UIComponentFactory<FieldElement> = ({ element, form }) => {
  // For fields we don't render the Input itself, we just adapt SnapUIInput.
  const children = getJsxChildren(element);
  const input = children[0] as InputElement;
  const button = children[1] as ButtonElement | undefined;
  const mappedButton =
    button &&
    buttonMapper({ element: button } as UIComponentParams<ButtonElement>);

  return {
    element: 'SnapUIInput',
    props: {
      id: input.props.name,
      placeholder: input.props.placeholder,
      label: element.props.label,
      textFieldProps: {
        type: input.props.type,
      },
      name: input.props.name,
      form,
      error: element.props.error !== undefined,
      helpText: element.props.error,
    },
    propComponents: {
      endAccessory: mappedButton && {
        ...mappedButton,
        props: {
          ...mappedButton.props,
          padding: 0,
        },
      },
    },
  };
};
