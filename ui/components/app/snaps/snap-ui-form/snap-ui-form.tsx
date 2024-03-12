import React, { FormEvent, FunctionComponent } from 'react';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { Box } from '../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

export type SnapUIFormProps = {
  name: string;
};

export const SnapUIForm: FunctionComponent<SnapUIFormProps> = ({
  children,
  name,
}) => {
  const { handleEvent } = useSnapInterfaceContext();

  const handleSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    handleEvent({ event: UserInputEventType.FormSubmitEvent, name });
  };

  return (
    <Box
      as="form"
      className="snap-ui-renderer__form"
      onSubmit={handleSubmit}
      id={name}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
    >
      {children}
    </Box>
  );
};
