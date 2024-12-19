import {
  FieldElement,
  InputElement,
  JSXElement,
  DropdownElement,
  RadioGroupElement,
  CheckboxElement,
  SelectorElement,
} from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { getPrimaryChildElementIndex, mapToTemplate } from '../utils';
import { dropdown as dropdownFn } from './dropdown';
import { radioGroup as radioGroupFn } from './radioGroup';
import { checkbox as checkboxFn } from './checkbox';
import { selector as selectorFn } from './selector';
import { UIComponentFactory, UIComponentParams } from './types';
import { constructInputProps } from './input';

export const field: UIComponentFactory<FieldElement> = ({
  element,
  form,
  ...params
}) => {
  // For fields we don't render the Input itself, we just adapt SnapUIInput.
  const children = getJsxChildren(element);
  const primaryChildIndex = getPrimaryChildElementIndex(
    children as JSXElement[],
  );
  const child = children[primaryChildIndex] as JSXElement;

  switch (child.type) {
    case 'FileInput': {
      return {
        element: 'SnapUIFileInput',
        props: {
          name: child.props.name,
          accept: child.props.accept,
          compact: child.props.compact,
          label: element.props.label,
          form,
          error: element.props.error !== undefined,
          helpText: element.props.error,
        },
      };
    }

    case 'Input': {
      const getLeftAccessory = () => {
        return mapToTemplate({
          ...params,
          element: children[0] as JSXElement,
        });
      };

      const getRightAccessory = (accessoryIndex: number) => {
        return mapToTemplate({
          ...params,
          element: children[accessoryIndex] as JSXElement,
        });
      };

      const input = child as InputElement;

      const leftAccessoryMapped =
        primaryChildIndex > 0 ? getLeftAccessory() : undefined;

      let rightAccessoryIndex: number | undefined;
      if (children[2]) {
        rightAccessoryIndex = 2;
      } else if (primaryChildIndex === 0 && children[1]) {
        rightAccessoryIndex = 1;
      }
      const rightAccessoryMapped = rightAccessoryIndex
        ? getRightAccessory(rightAccessoryIndex)
        : undefined;

      return {
        element: 'SnapUIInput',
        props: {
          id: input.props.name,
          placeholder: input.props.placeholder,
          label: element.props.label,
          ...constructInputProps(input.props),
          name: input.props.name,
          form,
          error: element.props.error !== undefined,
          helpText: element.props.error,
        },
        propComponents: {
          startAccessory: leftAccessoryMapped && {
            ...leftAccessoryMapped,
            props: {
              ...leftAccessoryMapped.props,
              padding: 0,
            },
          },
          endAccessory: rightAccessoryMapped && {
            ...rightAccessoryMapped,
            props: {
              ...rightAccessoryMapped.props,
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

    case 'RadioGroup': {
      const radioGroup = child as RadioGroupElement;
      const radioGroupMapped = radioGroupFn({
        element: radioGroup,
      } as UIComponentParams<RadioGroupElement>);
      return {
        element: 'SnapUIRadioGroup',
        props: {
          ...radioGroupMapped.props,
          id: radioGroup.props.name,
          label: element.props.label,
          name: radioGroup.props.name,
          form,
          error: element.props.error,
        },
      };
    }

    case 'Checkbox': {
      const checkbox = child as CheckboxElement;
      const checkboxMapped = checkboxFn({
        element: checkbox,
      } as UIComponentParams<CheckboxElement>);
      return {
        element: 'SnapUICheckbox',
        props: {
          ...checkboxMapped.props,
          fieldLabel: element.props.label,
          form,
          error: element.props.error,
        },
      };
    }

    case 'Selector': {
      const selector = child as SelectorElement;
      const selectorMapped = selectorFn({
        ...params,
        element: selector,
      } as UIComponentParams<SelectorElement>);
      return {
        ...selectorMapped,
        element: 'SnapUISelector',
        props: {
          ...selectorMapped.props,
          label: element.props.label,
          form,
          error: element.props.error,
        },
      };
    }

    default:
      throw new Error(`Invalid Field child: ${child.type}`);
  }
};
