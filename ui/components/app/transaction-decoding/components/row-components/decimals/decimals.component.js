import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import {
  fetchTokenDecimal,
  fetchTokenPrice,
} from '../../../../../../pages/swaps/swaps.util';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../advanced-gas-fee-popover/advanced-gas-fee-inputs/utils';
import { hexToDecimal } from '../../../../../../helpers/utils/conversions.util';
import {
  getCurrentChainId,
  getCurrentCurrency,
} from '../../../../../../selectors';

import { useCurrencyDisplay } from '../../../../../../hooks/useCurrencyDisplay';

export default function DecimalsDisplay({ tokenAddress, tokenAmount }) {
  const [formatedCryptoAmount, setFormatedCryptoAmount] = useState('');
  const [formatedFiatAmount, setFormatedFiatAmount] = useState('');
  const network = hexToDecimal(useSelector(getCurrentChainId));
  const currentCurrency = useSelector(getCurrentCurrency);

  const [, parts] = useCurrencyDisplay('1', {
    numberOfDecimals: 2,
    hideLabel: false,
    currency: currentCurrency,
  });

  const getSymbol = (value) => {
    const symbol = value.replace(/[0-9,. ]/gu, '');
    return symbol;
  };

  useEffect(() => {
    (async () => {
      const decimals = await fetchTokenDecimal(tokenAddress, network);
      const amount = new BigNumber(tokenAmount).dividedBy(
        new BigNumber(10 ** decimals),
      );
      const correctedAmount = roundToDecimalPlacesRemovingExtraZeroes(
        amount.toString(),
        4,
      );
      const price = await fetchTokenPrice(tokenAddress, currentCurrency);
      if (price) {
        const fiatAmountBN = correctedAmount.mul(new BigNumber(price));
        const fiatAmount = roundToDecimalPlacesRemovingExtraZeroes(
          fiatAmountBN.toString(),
          2,
        );
        setFormatedFiatAmount(
          `(${fiatAmount.toString()}${getSymbol(parts.value.toString())})`,
        );
      }
      setFormatedCryptoAmount(correctedAmount.toString());
    })();
  });

  return <div>{`${formatedCryptoAmount} ${formatedFiatAmount}`}</div>;
}

DecimalsDisplay.propTypes = {
  tokenAddress: PropTypes.string,
  tokenAmount: PropTypes.BigNumber,
};
