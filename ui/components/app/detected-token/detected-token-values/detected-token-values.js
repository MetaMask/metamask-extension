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

const DetectedTokenValues = ({ token }) => {
  const [selectedTokens, setSelectedTokens] = useState(false);
  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceToRender = tokensWithBalances[0]?.string;
  const balance = tokensWithBalances[0]?.balance;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-values">
      <Box marginBottom={1}>
        <Typography variant={TYPOGRAPHY.H4}>
          {`${balance || '0'} ${token.symbol}`}
        </Typography>
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_ALTERNATIVE}>
          {formattedFiatBalance || '$0'}
        </Typography>
      </Box>
      <Box className="detected-token-values__checkbox">
        <CheckBox
          checked={selectedTokens}
          onClick={() => setSelectedTokens((checked) => !checked)}
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
};

export default DetectedTokenValues;
