import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import Tooltip from '../../ui/tooltip';
import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import {
  SEND_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { startNewDraftTransaction } from '../../../ducks/send';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import {
  getCurrentKeyring,
  getIsSwapsChain,
  getIsBuyableCoinbasePayToken,
  getIsBuyableTransakToken,
  getIsBuyableMoonpayToken,
  getIsBuyableWyreToken,
  getUseCurrencyRateCheck,
} from '../../../selectors/selectors';

import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import SwapIcon from '../../ui/icon/swap-icon.component';
import SendIcon from '../../ui/icon/overview-send-icon.component';

import IconButton from '../../ui/icon-button';
import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { ASSET_TYPES } from '../../../../shared/constants/transaction';
import DepositPopover from '../deposit-popover';
import WalletOverview from './wallet-overview';

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const [showDepositPopover, setShowDepositPopover] = useState(false);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceToRender = tokensWithBalances[0]?.string;
  const balance = tokensWithBalances[0]?.balance;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isTokenBuyableCoinbasePay = useSelector((state) =>
    getIsBuyableCoinbasePayToken(state, token.symbol),
  );
  const isTokenBuyableTransak = useSelector((state) =>
    getIsBuyableTransakToken(state, token.symbol),
  );
  const isTokenBuyableMoonpay = useSelector((state) =>
    getIsBuyableMoonpayToken(state, token.symbol),
  );
  const isTokenBuyableWyre = useSelector((state) =>
    getIsBuyableWyreToken(state, token.symbol),
  );
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const isBuyable =
    isTokenBuyableCoinbasePay ||
    isTokenBuyableTransak ||
    isTokenBuyableMoonpay ||
    isTokenBuyableWyre;

  useEffect(() => {
    if (token.isERC721 && process.env.NFTS_V1) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);

  return (
    <>
      {showDepositPopover && (
        <DepositPopover
          onClose={() => setShowDepositPopover(false)}
          token={token}
        />
      )}
      <WalletOverview
        balance={
          <div className="token-overview__balance">
            <CurrencyDisplay
              className="token-overview__primary-balance"
              displayValue={balanceToRender}
              suffix={token.symbol}
            />
            {formattedFiatBalance && useCurrencyRateCheck ? (
              <CurrencyDisplay
                className="token-overview__secondary-balance"
                displayValue={formattedFiatBalance}
                hideLabel
              />
            ) : null}
          </div>
        }
        buttons={
          <>
            {isBuyable && (
              <IconButton
                className="token-overview__button"
                Icon={BuyIcon}
                label={t('buy')}
                onClick={() => {
                  trackEvent({
                    event: 'Clicked Deposit: Token',
                    category: EVENT.CATEGORIES.NAVIGATION,
                    properties: {
                      action: 'Home',
                      legacy_event: true,
                    },
                  });
                  setShowDepositPopover(true);
                }}
                disabled={token.isERC721}
              />
            )}
            <IconButton
              className="token-overview__button"
              onClick={async () => {
                trackEvent({
                  event: EVENT_NAMES.NAV_SEND_BUTTON_CLICKED,
                  category: EVENT.CATEGORIES.NAVIGATION,
                  properties: {
                    token_symbol: token.symbol,
                    location: EVENT.SOURCE.SWAPS.TOKEN_VIEW,
                    text: 'Send',
                  },
                });
                try {
                  await dispatch(
                    startNewDraftTransaction({
                      type: ASSET_TYPES.TOKEN,
                      details: token,
                    }),
                  );
                  history.push(SEND_ROUTE);
                } catch (err) {
                  if (!err.message.includes(INVALID_ASSET_TYPE)) {
                    throw err;
                  }
                }
              }}
              Icon={SendIcon}
              label={t('send')}
              data-testid="eth-overview-send"
              disabled={token.isERC721}
            />
            <IconButton
              className="token-overview__button"
              disabled={!isSwapsChain}
              Icon={SwapIcon}
              onClick={() => {
                if (isSwapsChain) {
                  trackEvent({
                    event: EVENT_NAMES.NAV_SWAP_BUTTON_CLICKED,
                    category: EVENT.CATEGORIES.SWAPS,
                    properties: {
                      token_symbol: token.symbol,
                      location: EVENT.SOURCE.SWAPS.TOKEN_VIEW,
                      text: 'Swap',
                    },
                  });
                  dispatch(
                    setSwapsFromToken({
                      ...token,
                      address: token.address.toLowerCase(),
                      iconUrl: token.image,
                      balance,
                      string: balanceToRender,
                    }),
                  );
                  if (usingHardwareWallet) {
                    global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
                  } else {
                    history.push(BUILD_QUOTE_ROUTE);
                  }
                }
              }}
              label={t('swap')}
              tooltipRender={
                isSwapsChain
                  ? null
                  : (contents) => (
                      <Tooltip
                        title={t('currentlyUnavailable')}
                        position="bottom"
                        disabled={isSwapsChain}
                      >
                        {contents}
                      </Tooltip>
                    )
              }
            />
          </>
        }
        className={className}
        icon={
          <Identicon
            diameter={32}
            address={token.address}
            image={token.image}
          />
        }
      />
    </>
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
