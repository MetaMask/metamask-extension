import { RadioGroupElement, RadioElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { UIComponentFactory } from './types';

export const radioGroup: UIComponentFactory<RadioGroupElement> = ({
  element,
  form,
}) => {
  const children = getJsxChildren(element) as RadioElement[];

  const options = children.map((child) => ({
    value: child.props.value,
    name: child.props.children,
    disabled: child.props.disabled,
  }));

  return {
    element: 'SnapUIRadioGroup',
    props: {
      id: element.props.name,
      name: element.props.name,
      disabled: element.props.disabled,
      form,
      options,
    },
  };
};
