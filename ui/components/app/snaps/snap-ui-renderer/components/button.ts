import { Button } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const button: UIComponentFactory<Button> = ({ element }) => ({
  element: 'SnapUIButton',
  props: {
    type: element.buttonType,
    variant: element.variant,
    name: element.name,
  },
  children: element.value,
});
