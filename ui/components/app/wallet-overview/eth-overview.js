import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  isBalanceCached,
  getShouldShowFiat,
  getCurrentChainId,
  getPreferences,
  getSelectedAccountCachedBalance,
} from '../../../selectors';

import Spinner from '../../ui/spinner';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { showPrimaryCurrency } from '../../../../shared/modules/currency-display.utils';
import WalletOverview from './wallet-overview';
import EthButtons from './eth-buttons';

const EthOverview = ({ className, showAddress }) => {
  const t = useContext(I18nContext);
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const chainId = useSelector(getCurrentChainId);
  const { ticker, type, rpcUrl } = useSelector(getProviderConfig);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );

  return (
    <WalletOverview
      showAddress={showAddress}
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className="eth-overview__balance">
            <div className="eth-overview__primary-container">
              {balance ? (
                <UserPreferencedCurrencyDisplay
                  style={{ display: 'contents' }}
                  className={classnames('eth-overview__primary-balance', {
                    'eth-overview__cached-balance': balanceIsCached,
                  })}
                  data-testid="eth-overview__primary-currency"
                  value={balance}
                  type={
                    showPrimaryCurrency(
                      isOriginalNativeSymbol,
                      useNativeCurrencyAsPrimaryCurrency,
                    )
                      ? PRIMARY
                      : SECONDARY
                  }
                  ethNumberOfDecimals={4}
                  hideTitle
                />
              ) : (
                <Spinner
                  color="var(--color-secondary-default)"
                  className="loading-overlay__spinner"
                />
              )}
              {balanceIsCached ? (
                <span className="eth-overview__cached-star">*</span>
              ) : null}
            </div>
            {showFiat && isOriginalNativeSymbol && balance && (
              <UserPreferencedCurrencyDisplay
                className={classnames({
                  'eth-overview__cached-secondary-balance': balanceIsCached,
                  'eth-overview__secondary-balance': !balanceIsCached,
                })}
                data-testid="eth-overview__secondary-currency"
                value={balance}
                type={SECONDARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
            )}
          </div>
        </Tooltip>
      }
      buttons={<EthButtons />}
      className={className}
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
  showAddress: PropTypes.bool,
};

export default EthOverview;
