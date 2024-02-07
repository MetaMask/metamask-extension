import { Address } from '@metamask/snaps-sdk';
import { UIComponent } from './types';

export const address: UIComponent<Address> = ({ element }) => ({
  element: 'ConfirmInfoRowAddress',
  props: {
    address: element.value,
  },
});
