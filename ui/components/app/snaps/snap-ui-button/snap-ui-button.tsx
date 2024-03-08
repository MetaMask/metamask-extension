import React, { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { Button, ButtonProps } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

export type SnapUIButtonProps = {
  name?: string;
};

export const SnapUIButton: FunctionComponent<
  SnapUIButtonProps & ButtonProps<'button'>
> = ({ name, children, type, ...props }) => {
  const { handleEvent } = useSnapInterfaceContext();

  const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (type === ButtonType.Button) {
      event.preventDefault();
    }

    handleEvent({ event: UserInputEventType.ButtonClickEvent, name });
  };

  return (
    <Button
      className="snap-ui-renderer__button"
      id={name}
      type={type}
      onClick={handleClick}
      block
      {...props}
    >
      {children}
    </Button>
  );
};
