import { ButtonElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const button: UIComponentFactory<ButtonElement> = ({ element }) => ({
  element: 'SnapUIButton',
  props: {
    type: element.props.type,
    // Temporarily set to a static value
    variant: 'primary', // TODO: Support the new variants for the buttons
    name: element.props.name,
    disabled: element.props.disabled,
  },
  children: element.props.children,
});
