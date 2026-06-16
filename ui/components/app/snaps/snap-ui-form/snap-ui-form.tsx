import React, { FormEvent } from 'react';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

export type SnapUIFormProps = {
  name: string;
};

export const SnapUIForm = ({
  children,
  name,
}: React.PropsWithChildren<SnapUIFormProps>) => {
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
      asChild
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      className="flex"
    >
      <form
        className="snap-ui-renderer__form"
        onSubmit={handleSubmit}
        id={name}
      >
        {children}
      </form>
    </Box>
  );
};
