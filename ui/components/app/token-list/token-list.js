import React from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';

import { useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { getShouldHideZeroBalanceTokens } from '../../../selectors';
import { getTokens } from '../../../ducks/metamask/metamask';

export default function TokenList({ onTokenClick }) {
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  // use `isEqual` comparison function because the token array is serialized
  // from the background so it has a new reference with each background update,
  // even if the tokens haven't changed
  const tokens = useSelector(getTokens, isEqual);
  const { tokensWithBalances } = useTokenTracker(
    tokens,
    true,
    shouldHideZeroBalanceTokens,
  );

  return (
    <>
      {tokensWithBalances.map((tokenData, index) => (
        <TokenCell key={index} {...tokenData} onClick={onTokenClick} />
      ))}
    </>
  );
}

TokenList.propTypes = {
  onTokenClick: PropTypes.func.isRequired,
};
