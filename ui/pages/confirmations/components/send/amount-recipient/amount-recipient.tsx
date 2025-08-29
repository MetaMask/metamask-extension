import React, { useCallback, useState } from 'react';

import { Button } from '../../../../../components/component-library';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { Amount } from '../amount/amount';
import { Header } from '../header';
import { Recipient } from '../recipient';

export const AmountRecipient = () => {
  const [to, setTo] = useState<string | undefined>();
  const { goToPreviousPage } = useNavigateSendPage();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();

  const onClick = useCallback(() => {
    handleSubmit(to);
    captureAmountSelected();
  }, [captureAmountSelected, handleSubmit, to]);

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
