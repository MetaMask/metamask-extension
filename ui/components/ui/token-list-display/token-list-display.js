import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { getShouldHideZeroBalanceTokens } from '../../../selectors';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import Identicon from '../identicon/identicon.component';
import TokenBalance from '../token-balance';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isEqual } from 'lodash';
import { getTokens } from '../../../ducks/metamask/metamask';

export default function TokenListDisplay(props) {
  const t = useI18nContext();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const { clickHandler } = props;

  const handleSelectToken = (token) => clickHandler(token);

  const tokens = useSelector(getTokens, isEqual);
  const { loading, tokensWithBalances } = useTokenTracker(
    tokens,
    true,
    shouldHideZeroBalanceTokens,
  );
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '250px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
        }}
      >
        {t('loadingTokens')}
      </div>
    );
  }


  return (
    <>
      {tokensWithBalances.map((tokenData) => {
        const { address, image, symbol } = tokenData;

        return (
          <div
            key={address}
            className="send-v2__asset-dropdown__asset"
            onClick={() => handleSelectToken(tokenData)}
          >
            <div className="send-v2__asset-dropdown__asset-icon">
              <Identicon address={address} diameter={36} image={image} />
            </div>
            <div className="send-v2__asset-dropdown__asset-data">
              <div className="send-v2__asset-dropdown__symbol">{symbol}</div>
              <div className="send-v2__asset-dropdown__name">
                <span className="send-v2__asset-dropdown__name__label">
                  {`${t('balance')}:`}
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
  clickHandler: PropTypes.func
};

TokenListDisplay.defaultProps = {
  className: undefined,
};
