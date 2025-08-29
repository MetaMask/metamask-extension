import React, { useCallback, useState } from 'react';

import { Button } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { Amount } from '../amount/amount';
import { Header } from '../header';
import { Recipient } from '../recipient';

export const AmountRecipient = () => {
  const [to, setTo] = useState<string | undefined>();
  const { goToPreviousPage } = useNavigateSendPage();
  const { handleSubmit } = useSendActions();

  const onClick = useCallback(() => {
    handleSubmit(to);
  }, [handleSubmit, to]);

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <Recipient setTo={setTo} />
          <Amount />
          <Button onClick={goToPreviousPage}>Previous</Button>
          <Button onClick={onClick}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
