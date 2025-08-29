import React, { useCallback, useState } from 'react';
import { ERC1155, ERC721 } from '@metamask/controller-utils';

import {
  Button,
  Text,
  TextField,
} from '../../../../../components/component-library';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useBalance } from '../../../hooks/send/useBalance';
import { useCurrencyConversions } from '../../../hooks/send/useCurrencyConversions';
import { useMaxAmount } from '../../../hooks/send/useMaxAmount';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../../../hooks/send/useSendType';

export const Amount = () => {
  const { asset, updateValue, value } = useSendContext();
  const [amount, setAmount] = useState(value ?? '');
  const { amountError } = useAmountValidation();
  const { balance } = useBalance();
  const [fiatMode, setFiatMode] = useState(false);
  const { getNativeValue } = useCurrencyConversions();
  const { getMaxAmount } = useMaxAmount();
  const { isNonEvmNativeSendType } = useSendType();
  const {
    setAmountInputMethodManual,
    setAmountInputMethodPasted,
    setAmountInputMethodPressedMax,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
  } = useAmountSelectionMetrics();

  const onChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      updateValue(fiatMode ? getNativeValue(newValue) : newValue);
      setAmount(newValue);
      setAmountInputMethodManual();
    },
    [fiatMode, getNativeValue, setAmount, updateValue],
  );

  const toggleFiatMode = useCallback(() => {
    const newFiatMode = !fiatMode;
    setAmount('');
    setFiatMode(newFiatMode);
    if (newFiatMode) {
      setAmountInputTypeFiat();
    } else {
      setAmountInputTypeToken();
    }
  }, [
    fiatMode,
    setAmount,
    setAmountInputTypeFiat,
    setAmountInputTypeToken,
    setFiatMode,
  ]);

  const updateToMax = useCallback(() => {
    const maxValue = getMaxAmount() ?? '0';
    updateValue(fiatMode ? getNativeValue(maxValue) : maxValue);
    setAmount(maxValue);
    setAmountInputMethodPressedMax();
  }, [
    fiatMode,
    getMaxAmount,
    getNativeValue,
    setAmount,
    setAmountInputMethodPressedMax,
    updateValue,
  ]);

  const isERC1155 = asset?.standard === ERC1155;
  const isERC721 = asset?.standard === ERC721;

  if (isERC721) {
    return null;
  }

  return (
    <div>
      <p>AMOUNT</p>
      <TextField
        onChange={onChange}
        onPaste={setAmountInputMethodPasted}
        value={amount}
      />
      <Text>Balance: {balance}</Text>
      <Text>Error: {amountError}</Text>
      {!isERC1155 && (
        <>
          <Button onClick={toggleFiatMode}>
            {fiatMode ? 'Native Mode' : 'Fiat Mode'}
          </Button>
          {!isNonEvmNativeSendType && (
            <Button onClick={updateToMax}>Max</Button>
          )}
        </>
      )}
    </div>
  );
};
