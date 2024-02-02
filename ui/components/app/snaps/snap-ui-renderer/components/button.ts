import { Button, ButtonTypes, UserInputEventTypes } from '@metamask/snaps-sdk';
import { MouseEvent } from 'react';
import { UiComponent } from './types';

export const button: UiComponent<Button> = ({ element, handleEvent }) => ({
  element: 'DSButton',
  props: {
    className: 'snap-ui-renderer__button',
    marginBottom: 1,
    block: true,
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (element.buttonType === ButtonTypes.Button) {
        event.preventDefault();
      }
      handleEvent({
        eventType: UserInputEventTypes.ButtonClickEvent,
        componentName: element.name,
      });
    },
    type: element.buttonType,
    variant: element.variant,
  },
  children: element.value,
});
