import React, { FormEvent, FunctionComponent } from 'react';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

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
    handleEvent(UserInputEventType.FormSubmitEvent, name);
  };

  return (
    <form className="snap-ui-renderer__form" onSubmit={handleSubmit} id={name}>
      {children}
    </form>
  );
};
