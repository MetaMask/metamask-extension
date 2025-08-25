import React, { useCallback, useState } from 'react';

import { Button, TextField } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';
import { Header } from '../header';

export const Recipient = () => {
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
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <p>TO</p>
          <TextField onChange={onChange} />
          <Button onClick={goToPreviousPage}>Previous</Button>
          <Button onClick={onClick}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
