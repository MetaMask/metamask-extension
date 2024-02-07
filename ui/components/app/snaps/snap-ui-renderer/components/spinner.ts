import { Spinner } from '@metamask/snaps-sdk';
import { UIComponent } from './types';

export const spinner: UIComponent<Spinner> = () => ({
  element: 'Spinner',
  props: {
    className: 'snap-ui-renderer__spinner',
  },
});
