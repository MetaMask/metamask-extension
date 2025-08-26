import React, { useCallback } from 'react';

import {
  Button,
  Text,
  TextField,
} from '../../../../../components/component-library';
import { useBalance } from '../../../hooks/send/useBalance';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendContext } from '../../../context/send';
import { Header } from '../header';

export const Amount = () => {
  const { goToSendToPage, goToPreviousPage } = useNavigateSendPage();
  const { updateValue } = useSendContext();
  const { balance } = useBalance();

  const onChange = useCallback(
    (event) => updateValue(event.target.value),
    [updateValue],
  );

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <p>AMOUNTs</p>
          <TextField onChange={onChange} />
          <Text>Balance: {balance}</Text>
          <Button onClick={goToPreviousPage}>Previous</Button>
          <Button onClick={goToSendToPage}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
