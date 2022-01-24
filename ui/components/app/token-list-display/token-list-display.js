import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import { getShouldHideZeroBalanceTokens } from '../../../selectors';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import Identicon from '../../ui/identicon';
import TokenBalance from '../../ui/token-balance';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTokens } from '../../../ducks/metamask/metamask';

export default function TokenListDisplay({clickHandler}) {
  const t = useI18nContext();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const tokens = useSelector(getTokens, isEqual);
  const { loading, tokensWithBalances } = useTokenTracker(
    tokens,
    true,
    shouldHideZeroBalanceTokens,
  );
  if (loading) {
    return (
      <div
        className='loading-span'
      >
        {t('loadingTokens')}
      </div>
    );
  }

  const sendableTokens = tokensWithBalances.filter((token) => !token.isERC721);

  return (
    <>
      {sendableTokens.map((tokenData) => {
        const { address, image, symbol } = tokenData;

        return (
          <div
            key={address}
            className="token-list-item"
            onClick={() => clickHandler(tokenData)}
          >
            <div className="send-v2__asset-dropdown__asset-icon">
              <Identicon address={address} diameter={36} />
            </div>
            <div className="send-v2__asset-dropdown__asset-data">
              <div className="send-v2__asset-dropdown__symbol">{symbol}</div>
              <div className="send-v2__asset-dropdown__name">
                <span className="send-v2__asset-dropdown__name__label">
                  {`${t('balance')}:`}
                  ssssss
                </span>
                <TokenBalance token={tokenData} />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

TokenListDisplay.propTypes = {
  clickHandler: PropTypes.func,
};
