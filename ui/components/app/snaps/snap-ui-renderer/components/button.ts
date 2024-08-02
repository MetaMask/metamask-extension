import { ButtonElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const button: UIComponentFactory<ButtonElement> = ({
  element,
  footer,
}) => ({
  element: 'SnapUIButton',
  props: {
    footer,
    type: element.props.type,
    variant: element.props.variant,
    name: element.props.name,
    disabled: element.props.disabled,
  },
  children: element.props.children,
});
