import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import Tooltip from '../../ui/tooltip';
import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import {
  useMetricEvent,
  useNewMetricEvent,
} from '../../../hooks/useMetricEvent';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { updateSendToken } from '../../../store/actions';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import {
  getAssetImages,
  getCurrentKeyring,
  getIsSwapsChain,
} from '../../../selectors/selectors';

import SwapIcon from '../../ui/icon/swap-icon.component';
import SendIcon from '../../ui/icon/overview-send-icon.component';

import IconButton from '../../ui/icon-button';
import WalletOverview from './wallet-overview';

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const sendTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Token',
    },
  });
  const history = useHistory();
  const assetImages = useSelector(getAssetImages);

  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = keyring.type.search('Hardware') !== -1;
  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceToRender = tokensWithBalances[0]?.string;
  const balance = tokensWithBalances[0]?.balance;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );
  const isSwapsChain = useSelector(getIsSwapsChain);
  const enteredSwapsEvent = useNewMetricEvent({
    event: 'Swaps Opened',
    properties: { source: 'Token View', active_currency: token.symbol },
    category: 'swaps',
  });

  return (
    <WalletOverview
      balance={
        <div className="token-overview__balance">
          <CurrencyDisplay
            className="token-overview__primary-balance"
            displayValue={balanceToRender}
            suffix={token.symbol}
          />
          {formattedFiatBalance ? (
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
          <IconButton
            className="token-overview__button"
            onClick={() => {
              sendTokenEvent();
              dispatch(updateSendToken(token));
              history.push(SEND_ROUTE);
            }}
            Icon={SendIcon}
            label={t('send')}
            data-testid="eth-overview-send"
          />
          <IconButton
            className="token-overview__button"
            disabled={!isSwapsChain}
            Icon={SwapIcon}
            onClick={() => {
              if (isSwapsChain) {
                enteredSwapsEvent();
                dispatch(
                  setSwapsFromToken({
                    ...token,
                    iconUrl: assetImages[token.address],
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
            tooltipRender={(contents) => (
              <Tooltip
                title={t('onlyAvailableOnMainnet')}
                position="bottom"
                disabled={isSwapsChain}
              >
                {contents}
              </Tooltip>
            )}
          />
        </>
      }
      className={className}
      icon={
        <Identicon
          diameter={32}
          address={token.address}
          image={assetImages[token.address]}
        />
      }
    />
  );
};

TokenOverview.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
};

TokenOverview.defaultProps = {
  className: undefined,
};

export default TokenOverview;
