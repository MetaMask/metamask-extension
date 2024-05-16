import { FieldElement, InputElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { UIComponentFactory } from './types';

export const field: UIComponentFactory<FieldElement> = ({ element, form }) => {
  // For fields we don't render the Input itself, we just adapt SnapUIInput.
  const input = getJsxChildren(element)[0] as InputElement;

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
  };
};
