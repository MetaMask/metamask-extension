import type { SpinnerElement } from '@metamask/snaps-sdk/jsx';

import type { UIComponentFactory } from './types';

export const spinner: UIComponentFactory<SpinnerElement> = () => ({
  element: 'Preloader',
  props: {
    className: 'snap-ui-renderer__spinner',
  },
});
