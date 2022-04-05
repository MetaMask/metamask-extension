import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import CheckBox from '../../../ui/check-box';

import {
  COLORS,
  DISPLAY,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';

const DetectedTokenValues = ({ token, handleTokenSelection }) => {
  const [selectToken, setSelectToken] = useState(false);
  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceString = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceString,
    token.symbol,
  );

  const handleCheckBoxSelection = () => {
    setSelectToken(!selectToken);
    handleTokenSelection(token.address)
  }

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-values">
      <Box marginBottom={1}>
        <Typography variant={TYPOGRAPHY.H4}>
          {`${balanceString || '0'} ${token.symbol}`}
        </Typography>
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_ALTERNATIVE}>
          {formattedFiatBalance || '$0'}
        </Typography>
      </Box>
      <Box className="detected-token-values__checkbox">
        <CheckBox
          checked={selectToken}
          onClick={handleCheckBoxSelection}
          // onClick={() => setSelectedTokens((checked) => !checked)}
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
  }),
  handleTokenSelection: PropTypes.func.isRequired
};

export default DetectedTokenValues;
