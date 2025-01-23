import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getSelectedAddress,
  getUseCurrencyRateCheck,
} from '../../../../selectors';
import { Box, Checkbox, Text } from '../../../component-library';
import { useTokenTracker } from '../../../../hooks/useTokenBalances';

const DetectedTokenValues = ({
  token,
  handleTokenSelection,
  tokensListDetected,
}) => {
  const [tokenSelection, setTokenSelection] = useState(() => {
    return tokensListDetected[token.address]?.selected;
  });

  const selectedAddress = useSelector(getSelectedAddress);
  const currentChainId = useSelector(getCurrentChainId);
  const chainId = token.chainId ?? currentChainId;

  const { tokensWithBalances } = useTokenTracker({
    chainId,
    tokens: [token],
    address: selectedAddress,
    hideZeroBalanceTokens: false,
  });

  const balanceString = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceString,
    token.symbol,
    {},
    false,
    chainId,
  );

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  useEffect(() => {
    setTokenSelection(tokensListDetected[token.address]?.selected);
  }, [tokensListDetected, token.address, tokenSelection, setTokenSelection]);

  const handleCheckBoxSelection = () => {
    setTokenSelection(!tokenSelection);
    handleTokenSelection(token);
  };

  return (
    <Box display={Display.InlineFlex} className="detected-token-values">
      <Box marginBottom={1}>
        <Text variant={TextVariant.bodyLgMedium} as="h4">
          {`${balanceString || '0'} ${token.symbol}`}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textAlternative}
        >
          {useCurrencyRateCheck
            ? formattedFiatBalance || '$0' // since formattedFiatBalance will be when the conversion rate is not obtained, should replace the `$0` with `N/A`
            : formattedFiatBalance}
        </Text>
      </Box>
      <Box className="detected-token-values__checkbox">
        <Checkbox
          isChecked={tokenSelection}
          onClick={handleCheckBoxSelection}
        />
      </Box>
    </Box>
  );
};

DetectedTokenValues.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    iconUrl: PropTypes.string,
    aggregators: PropTypes.array,
    chainId: PropTypes.string,
  }),
  handleTokenSelection: PropTypes.func.isRequired,
  tokensListDetected: PropTypes.object,
};

export default DetectedTokenValues;
