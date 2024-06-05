import { SpinnerElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const spinner: UIComponentFactory<SpinnerElement> = () => ({
  element: 'Spinner',
  props: {
    className: 'snap-ui-renderer__spinner',
  },
});
