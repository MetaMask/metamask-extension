import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import CurrencyDisplay from '../../ui/currency-display';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { showModal } from '../../../store/actions';
import { useIsOriginalTokenSymbol } from '../../../hooks/useIsOriginalTokenSymbol';
import WalletOverview from './wallet-overview';
import TokenButtons from './token-buttons';

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch();
  const { tokensWithBalances } = useTokenTracker({ tokens: [token] });
  const balanceToRender = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(
    token.address,
    token.symbol,
  );

  useEffect(() => {
    if (token.isERC721) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);

  return (
    <WalletOverview
      showAddress={false}
      balance={
        <div className="token-overview__balance">
          <div className="token-overview__primary-container">
            <CurrencyDisplay
              style={{ display: 'contents' }}
              className="token-overview__primary-balance"
              displayValue={balanceToRender}
              suffix={token.symbol}
            />
          </div>
          {formattedFiatBalance && isOriginalTokenSymbol ? (
            <CurrencyDisplay
              className="token-overview__secondary-balance"
              displayValue={formattedFiatBalance}
              hideLabel
            />
          ) : null}
        </div>
      }
      buttons={<TokenButtons token={token} />}
      className={className}
    />
  );
};

TokenOverview.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    image: PropTypes.string,
    isERC721: PropTypes.bool,
  }).isRequired,
};

TokenOverview.defaultProps = {
  className: undefined,
};

export default TokenOverview;
