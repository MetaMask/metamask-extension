import React, { useCallback } from 'react';

import {
  Button,
  Text,
  TextField,
} from '../../../../../components/component-library';
import { useBalance } from '../../../hooks/send/useBalance';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendContext } from '../../../context/send';

export const Amount = () => {
  const { goToSendToPage, goToPreviousPage } = useNavigateSendPage();
  const { updateValue } = useSendContext();
  const { balance } = useBalance();

  const onChange = useCallback(
    (event) => updateValue(event.target.value),
    [updateValue],
  );

  return (
    <div>
      <p>AMOUNTs</p>
      <TextField onChange={onChange} />
      <Text>Balance: {balance}</Text>
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button onClick={goToSendToPage}>Continue</Button>
    </div>
  );
};
