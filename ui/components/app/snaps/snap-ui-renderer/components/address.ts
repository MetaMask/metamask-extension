import { Address } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const address: UIComponentFactory<Address> = ({ element }) => ({
  element: 'ConfirmInfoRowAddress',
  props: {
    address: element.value,
  },
});
