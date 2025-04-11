import type { DropdownElement, OptionElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import type { UIComponentFactory } from './types';

export const dropdown: UIComponentFactory<DropdownElement> = ({
  element,
  form,
}) => {
  const children = getJsxChildren(element) as OptionElement[];

  const options = children.map((child) => ({
    value: child.props.value,
    name: child.props.children,
    disabled: child.props.disabled,
  }));

  return {
    element: 'SnapUIDropdown',
    props: {
      id: element.props.name,
      name: element.props.name,
      disabled: element.props.disabled,
      form,
      options,
    },
  };
};
