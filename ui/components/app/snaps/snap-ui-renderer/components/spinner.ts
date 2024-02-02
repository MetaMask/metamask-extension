import { Spinner } from '@metamask/snaps-sdk';
import { UiComponent } from './types';

export const spinner: UiComponent<Spinner> = () => ({
  element: 'Spinner',
  props: {
    className: 'snap-ui-renderer__spinner',
  },
});
