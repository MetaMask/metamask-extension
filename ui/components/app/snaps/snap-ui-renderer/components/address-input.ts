import { AddressInputElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const addressInput: UIComponentFactory<AddressInputElement> = ({
  element,
  form,
}) => {
  return {
    element: 'SnapUIAddressInput',
    props: {
      name: element.props.name,
      placeholder: element.props.placeholder,
      disabled: element.props.disabled,
      chainId: element.props.chainId,
      form,
      displayAvatar: element.props.displayAvatar,
    },
  };
};
