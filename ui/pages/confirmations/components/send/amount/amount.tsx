import React, { useCallback, useState } from 'react';

import {
  Button,
  Text,
  TextField,
} from '../../../../../components/component-library';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useBalance } from '../../../hooks/send/useBalance';
import { useCurrencyConversions } from '../../../hooks/send/useCurrencyConversions';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendContext } from '../../../context/send';
import { Header } from '../header';

export const Amount = () => {
  const [amount, setAmount] = useState('');
  const { amountError } = useAmountValidation();
  const { balance } = useBalance();
  const [faitMode, setFiatMode] = useState(false);
  const { getNativeValue } = useCurrencyConversions();
  const { goToSendToPage, goToPreviousPage } = useNavigateSendPage();
  const { updateValue } = useSendContext();

  const onChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      updateValue(faitMode ? getNativeValue(newValue) : newValue);
      setAmount(newValue);
    },
    [faitMode, getNativeValue, setAmount, updateValue],
  );

  const toggleFiatMode = useCallback(() => {
    setAmount('');
    setFiatMode(!faitMode);
  }, [faitMode, setAmount, setFiatMode]);

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <p>AMOUNTs</p>
          <TextField value={amount} onChange={onChange} />
          <Text>Balance: {balance}</Text>
          <Text>Error: {amountError}</Text>
          <Button onClick={toggleFiatMode}>
            {faitMode ? 'Native Mode' : 'Fiat Mode'}
          </Button>
          <Button onClick={goToPreviousPage}>Previous</Button>
          <Button onClick={goToSendToPage}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
