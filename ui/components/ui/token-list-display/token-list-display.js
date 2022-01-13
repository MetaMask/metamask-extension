import React from 'react';
// import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { getShouldHideZeroBalanceTokens } from '../../../selectors';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import Identicon from '../identicon/identicon.component';
import TokenBalance from '../token-balance';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TokenListDisplay(props) {
  const t = useI18nContext();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const { sendableTokens, clickHandler } = props;

  const { tokensWithBalances } = useTokenTracker(
    sendableTokens,
    true,
    shouldHideZeroBalanceTokens,
  );

  const handleSelectToken = (token) => clickHandler(token);

  return (
    <>
      {tokensWithBalances.map((tokenData) => {
        const { address, image, symbol } = tokenData;
        console.log(tokenData, 'OUTSIDE')

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

// TokenListDisplay.propTypes = {
//   className: PropTypes.string,
//   token: PropTypes.shape({
//     address: PropTypes.string.isRequired,
//     decimals: PropTypes.number,
//     symbol: PropTypes.string,
//     image: PropTypes.string,
//   }).isRequired,
// };

// TokenListDisplay.defaultProps = {
//   className: undefined,
// };
