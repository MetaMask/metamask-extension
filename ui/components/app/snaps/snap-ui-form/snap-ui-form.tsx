import { UserInputEventType } from '@metamask/snaps-sdk';
import type { FormEvent, FunctionComponent } from 'react';
import React from 'react';

import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { Box } from '../../../component-library';

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
    handleEvent({
      event: UserInputEventType.FormSubmitEvent,
      name,
    });
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
