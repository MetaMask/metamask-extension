import { AddressElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const address: UIComponentFactory<AddressElement> = ({ element }) => ({
  element: 'SnapUIAddress',
  props: {
    address: element.props.address,
    diameter: 16,
  },
});
