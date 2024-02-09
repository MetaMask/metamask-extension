import { Spinner } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const spinner: UIComponentFactory<Spinner> = () => ({
  element: 'Spinner',
  props: {
    className: 'snap-ui-renderer__spinner',
  },
});
