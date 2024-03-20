import { Copyable } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const copyable: UIComponentFactory<Copyable> = ({ element }) => ({
  element: 'Copyable',
  props: {
    text: element.value,
    sensitive: element.sensitive,
  },
});
