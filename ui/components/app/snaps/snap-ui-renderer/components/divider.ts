import { DividerElement } from '@metamask/snaps-sdk/jsx';
import { BorderColor } from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const divider: UIComponentFactory<DividerElement> = () => ({
  element: 'Box',
  props: {
    className: 'snap-ui-renderer__divider',
    backgroundColor: BorderColor.borderMuted,
  },
});
