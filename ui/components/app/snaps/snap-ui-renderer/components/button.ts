import { Button, ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { MouseEvent } from 'react';
import { UiComponent } from './types';

export const button: UiComponent<Button> = ({ element, handleEvent }) => ({
  element: 'DSButton',
  props: {
    className: 'snap-ui-renderer__button',
    marginTop: 1,
    marginBottom: 1,
    block: true,
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (element.buttonType === ButtonType.Button) {
        event.preventDefault();
      }
      handleEvent({
        eventType: UserInputEventType.ButtonClickEvent,
        componentName: element.name,
      });
    },
    type: element.buttonType,
    variant: element.variant,
  },
  children: element.value,
});
