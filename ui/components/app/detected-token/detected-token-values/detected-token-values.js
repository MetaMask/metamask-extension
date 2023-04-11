import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import CheckBox from '../../../ui/check-box';

import {
  DISPLAY,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getUseCurrencyRateCheck } from '../../../../selectors';

const DetectedTokenValues = ({
  token,
  handleTokenSelection,
  tokensListDetected,
}) => {
  const [tokenSelection, setTokenSelection] = useState(() => {
    return tokensListDetected[token.address]?.selected;
  });

  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceString = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceString,
    token.symbol,
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
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-values">
      <Box marginBottom={1}>
        <Typography variant={TypographyVariant.H4}>
          {`${balanceString || '0'} ${token.symbol}`}
        </Typography>
        <Typography
          variant={TypographyVariant.H7}
          color={TextColor.textAlternative}
        >
          {useCurrencyRateCheck
            ? formattedFiatBalance || '$0' // since formattedFiatBalance will be when teh conversion rate is not obtained, should be replace the `$0` with `N/A`
            : formattedFiatBalance}
        </Typography>
      </Box>
      <Box className="detected-token-values__checkbox">
        <CheckBox checked={tokenSelection} onClick={handleCheckBoxSelection} />
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
  }),
  handleTokenSelection: PropTypes.func.isRequired,
  tokensListDetected: PropTypes.object,
};

export default DetectedTokenValues;
