import { Copyable } from '@metamask/snaps-sdk';
import { UIComponent } from './types';

export const copyable: UIComponent<Copyable> = ({ element }) => ({
  element: 'Copyable',
  props: {
    text: element.value,
    sensitive: element.sensitive,
  },
});
