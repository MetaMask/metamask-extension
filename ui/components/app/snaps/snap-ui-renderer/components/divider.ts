import { Divider } from '@metamask/snaps-sdk';
import { BorderColor } from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const divider: UIComponentFactory<Divider> = () => ({
  element: 'Box',
  props: {
    className: 'snap-ui-renderer__divider',
    backgroundColor: BorderColor.borderDefault,
  },
});
