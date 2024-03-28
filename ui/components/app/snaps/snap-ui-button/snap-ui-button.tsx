import React, { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { ButtonLinkProps, Text } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { FontWeight } from '../../../../helpers/constants/design-system';

export type SnapUIButtonProps = {
  name?: string;
};

export const SnapUIButton: FunctionComponent<
  SnapUIButtonProps & ButtonLinkProps<'button'>
> = ({ name, children, type, ...props }) => {
  const { handleEvent } = useSnapInterfaceContext();

  const handleClick = (event: ReactMouseEvent<any>) => {
    if (type === ButtonType.Button) {
      event.preventDefault();
    }

    handleEvent({ event: UserInputEventType.ButtonClickEvent, name });
  };

  return (
    <Text
      className="snap-ui-button"
      as="button"
      id={name}
      type={type}
      fontWeight={FontWeight.Medium}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Text>
  );
};
