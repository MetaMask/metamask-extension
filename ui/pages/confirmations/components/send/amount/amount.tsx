import React, { useCallback, useState } from 'react';

import {
  Button,
  Text,
  TextField,
} from '../../../../../components/component-library';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useBalance } from '../../../hooks/send/useBalance';
import { useCurrencyConversions } from '../../../hooks/send/useCurrencyConversions';
import { useSendContext } from '../../../context/send';

export const Amount = () => {
  const { value, updateValue } = useSendContext();
  const [amount, setAmount] = useState(value ?? '');
  const { amountError } = useAmountValidation();
  const { balance } = useBalance();
  const [fiatMode, setFiatMode] = useState(false);
  const { getNativeValue } = useCurrencyConversions();

  const onChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      updateValue(fiatMode ? getNativeValue(newValue) : newValue);
      setAmount(newValue);
    },
    [fiatMode, getNativeValue, setAmount, updateValue],
  );

  const toggleFiatMode = useCallback(() => {
    setAmount('');
    setFiatMode(!fiatMode);
  }, [fiatMode, setAmount, setFiatMode]);

  return (
    <div>
      <p>AMOUNT</p>
      <TextField value={amount} onChange={onChange} />
      <Text>Balance: {balance}</Text>
      <Text>Error: {amountError}</Text>
      <Button onClick={toggleFiatMode}>
        {fiatMode ? 'Native Mode' : 'Fiat Mode'}
      </Button>
    </div>
  );
};
