import { FileInputElement } from '@metamask/snaps-sdk/jsx';

import { UIComponentFactory } from './types';

export const fileInput: UIComponentFactory<FileInputElement> = ({
  element,
  form,
}) => ({
  element: 'SnapUIFileInput',
  props: {
    name: element.props.name,
    accept: element.props.accept,
    compact: element.props.compact,
    disabled: element.props.disabled,
    form,
  },
});
