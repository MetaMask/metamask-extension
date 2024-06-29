import { AddressElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const address: UIComponentFactory<AddressElement> = ({ element }) => ({
  element: 'ConfirmInfoRowAddress',
  props: {
    address: element.props.address,
    isSnapUsingThis: true,
  },
});
