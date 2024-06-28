import { FileInputElement } from '@metamask/snaps-sdk/jsx';

import { UIComponentFactory } from './types';

export const fileInput: UIComponentFactory<FileInputElement> = ({
  element,
  form,
}) => ({
  element: 'SnapUIInput',
  props: {
    element: 'SnapUIFileInput',
    props: {
      name: element.props.name,
      accept: element.props.accept,
      compact: element.props.compact,
      form,
    },
  },
});
