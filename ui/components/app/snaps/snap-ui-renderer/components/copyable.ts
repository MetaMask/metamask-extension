import { Copyable } from '@metamask/snaps-sdk';
import { UiComponent } from './types';

export const copyable: UiComponent<Copyable> = ({ element }) => ({
  element: 'Copyable',
  props: {
    text: element.value,
    // @ts-expect-error waiting for correct type
    sensitive: element.sensitive,
  },
});
