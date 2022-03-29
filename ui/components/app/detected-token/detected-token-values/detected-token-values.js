import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import Identicon from '../../../ui/identicon';

import { getTokenList } from '../../../../selectors';
import {
  COLORS,
  DISPLAY,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';

const DetectedTokenValues = ({ tokenAddress }) => {
  const tokenList = useSelector(getTokenList);
  const token = tokenList[tokenAddress];
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
      <Box marginTop={1}>
        <Identicon address={tokenAddress} diameter={42} />
      </Box>
      <Box marginLeft={2}>
        <Typography variant={TYPOGRAPHY.H4}>
          {`${balance || '0'} ${token.symbol}`}
        </Typography>
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_ALTERNATIVE}>
          {formattedFiatBalance || '$0'}
        </Typography>
      </Box>
    </Box>
  );
};

DetectedTokenValues.propTypes = {
  tokenAddress: PropTypes.string,
};

export default DetectedTokenValues;
