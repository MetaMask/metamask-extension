import React, { useCallback, useState } from 'react';

import { Button, TextField } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';

export const SendTo = () => {
  const [to, setTo] = useState('');
  const { goToPreviousPage } = useNavigateSendPage();
  const { handleSubmit } = useSendActions();
  const { updateTo } = useSendContext();

  const onChange = useCallback(
    (e) => {
      const toAddress = e.target.value;
      setTo(toAddress);
      updateTo(toAddress);
    },
    [setTo, updateTo],
  );

  const onClick = useCallback(() => {
    handleSubmit(to);
  }, [handleSubmit, to]);

  return (
    <div>
      <p>TO</p>
      <TextField onChange={onChange} />
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button onClick={onClick}>Continue</Button>
    </div>
  );
};
