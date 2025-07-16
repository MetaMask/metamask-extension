import { ValueElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const value: UIComponentFactory<ValueElement> = ({ element }) => ({
  element: 'ConfirmInfoRowValueDouble',
  props: {
    left: element.props.extra,
    right: element.props.value,
  },
});
