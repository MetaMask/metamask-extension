import { ButtonElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const button: UIComponentFactory<ButtonElement> = ({ element }) => ({
  element: 'SnapUIButton',
  props: {
    type: element.props.type,
    variant: element.props.variant === 'destructive' ? 'secondary' : 'primary', // TODO: Support the new variants for the buttons
    name: element.props.name,
    disabled: element.props.disabled,
  },
  children: element.props.children,
});
