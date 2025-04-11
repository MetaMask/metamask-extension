import type { CopyableElement } from '@metamask/snaps-sdk/jsx';

import type { UIComponentFactory } from './types';

export const copyable: UIComponentFactory<CopyableElement> = ({ element }) => ({
  element: 'Copyable',
  props: {
    text: element.props.value,
    sensitive: element.props.sensitive,
  },
});
