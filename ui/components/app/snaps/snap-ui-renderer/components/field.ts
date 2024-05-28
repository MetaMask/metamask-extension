import {
  FieldElement,
  InputElement,
  ButtonElement,
  JSXElement,
  DropdownElement,
} from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { button as buttonFn } from './button';
import { dropdown as dropdownFn } from './dropdown';
import { UIComponentFactory, UIComponentParams } from './types';

export const field: UIComponentFactory<FieldElement> = ({ element, form }) => {
  // For fields we don't render the Input itself, we just adapt SnapUIInput.
  const children = getJsxChildren(element);
  const child = children[0] as JSXElement;

  switch (child.type) {
    case 'Input': {
      const input = child as InputElement;
      const button = children[1] as ButtonElement;
      const buttonMapped =
        button &&
        buttonFn({ element: button } as UIComponentParams<ButtonElement>);
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
          endAccessory: buttonMapped && {
            ...buttonMapped,
            props: {
              ...buttonMapped.props,
              padding: 0,
            },
          },
        },
      };
    }

    case 'Dropdown': {
      const dropdown = child as DropdownElement;
      const dropdownMapped = dropdownFn({
        element: dropdown,
      } as UIComponentParams<DropdownElement>);
      return {
        element: 'SnapUIDropdown',
        props: {
          ...dropdownMapped.props,
          id: dropdown.props.name,
          label: element.props.label,
          name: dropdown.props.name,
          form,
          error: element.props.error,
        },
      };
    }

    default:
      throw new Error(`Invalid Field child: ${child.type}`);
  }
};
