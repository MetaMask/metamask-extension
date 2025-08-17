import React, { useCallback } from 'react';

import { Button, TextField } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendContext } from '../../../context/send';

export const Amount = () => {
  const { goToSendToPage, goToPreviousPage } = useNavigateSendPage();
  const { updateValue, value } = useSendContext();

  const onChange = useCallback(
    (event) => updateValue(event.target.value),
    [updateValue],
  );

  return (
    <div>
      <p>AMOUNT</p>
      <TextField onChange={onChange} />
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button onClick={goToSendToPage}>Continue</Button>
    </div>
  );
};
