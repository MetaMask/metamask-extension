import { DropdownElement, OptionElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { UIComponentFactory } from './types';

export const dropdown: UIComponentFactory<DropdownElement> = ({
  element,
  form,
}) => {
  const children = getJsxChildren(element) as OptionElement[];

  const options = children.map((child) => ({
    value: child.props.value,
    name: child.props.children,
  }));

  return {
    element: 'SnapUIDropdown',
    props: {
      id: element.props.name,
      name: element.props.name,
      form,
      options,
    },
  };
};
