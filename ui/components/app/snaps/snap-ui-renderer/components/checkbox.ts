import { CheckboxElement } from '@metamask/snaps-sdk/jsx';

import { UIComponentFactory } from './types';

export const checkbox: UIComponentFactory<CheckboxElement> = ({
  element,
  form,
}) => ({
  element: 'SnapUICheckbox',
  props: {
    name: element.props.name,
    label: element.props.label,
    variant: element.props.variant,
    form,
  },
});
