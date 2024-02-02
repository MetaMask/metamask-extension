import { Address } from '@metamask/snaps-sdk';
import { UiComponent } from './types';

export const address: UiComponent<Address> = ({ element }) => ({
  element: 'ConfirmInfoRowAddress',
  props: {
    address: element.value,
  },
});
