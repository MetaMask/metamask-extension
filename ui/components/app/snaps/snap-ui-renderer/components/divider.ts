import { Divider } from '@metamask/snaps-sdk';
import { BorderColor } from '../../../../../helpers/constants/design-system';
import { UIComponent } from './types';

export const divider: UIComponent<Divider> = () => ({
  element: 'Box',
  props: {
    className: 'snap-ui-renderer__divider',
    backgroundColor: BorderColor.borderDefault,
    marginTop: 2,
    marginBottom: 2,
  },
});
