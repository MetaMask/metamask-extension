import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';

import { EthMethod } from '@metamask/keyring-api';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  isBalanceCached,
  getIsSwapsChain,
  getCurrentChainId,
  getPreferences,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getCurrentNetwork,
  getSelectedAccountCachedBalance,
  getShowFiatInTestnets,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getCurrentKeyring,
  getIsBridgeChain,
  getIsBuyableChain,
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IF
import IconButton from '../../ui/icon-button';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/constants/metametrics';
import Spinner from '../../ui/spinner';
import { startNewDraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/experiences/useRamps';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IF
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { showPrimaryCurrency } from '../../../../shared/modules/currency-display.utils';
import { TEST_NETWORKS } from '../../../../shared/constants/network';
import WalletOverview from './wallet-overview';

const EthOverview = ({ className, showAddress }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IF
  const balanceIsCached = useSelector(isBalanceCached);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const chainId = useSelector(getCurrentChainId);
  const { ticker, type } = useSelector(getProviderConfig);
  const currentNetwork = useSelector(getCurrentNetwork);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
  );

  // Total fiat balance
  const account = useSelector(getSelectedInternalAccount);
  const selectedAddress = account.address;
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { totalWeiBalance } = useAccountTotalFiatBalance(
    selectedAddress,
    shouldHideZeroBalanceTokens,
  );
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    TEST_NETWORKS.includes(currentNetwork?.nickname) && !showFiatInTestnets;

  let balanceToUse = totalWeiBalance;

  if (showFiat) {
    balanceToUse = balance;
  }

  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  const buttonTooltips = {
    buyButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !isBuyableChain, message: '' },
      ///: END:ONLY_INCLUDE_IF
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    sendButton: [
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    swapButton: [
      { condition: !isSwapsChain, message: 'currentlyUnavailable' },
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    bridgeButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !isBridgeChain, message: 'currentlyUnavailable' },
      ///: END:ONLY_INCLUDE_IF
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
  };

  const generateTooltip = (buttonKey, contents) => {
    const conditions = buttonTooltips[buttonKey];
    const tooltipInfo = conditions.find(({ condition }) => condition);
    if (tooltipInfo && tooltipInfo.message) {
      return (
        <Tooltip title={t(tooltipInfo.message)} position="bottom">
          {contents}
        </Tooltip>
      );
    }
    return contents;
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const portfolioEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };

  const stakingEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };

  const renderInstitutionalButtons = () => {
    return (
      <>
        <IconButton
          className="eth-overview__button"
          Icon={<Icon name={IconName.Stake} color={IconColor.primaryInverse} />}
          label={t('stake')}
          onClick={() => {
            stakingEvent();
            global.platform.openTab({
              url: `${mmiPortfolioUrl}/stake`,
            });
          }}
        />
        {mmiPortfolioEnabled && (
          <IconButton
            className="eth-overview__button"
            Icon={
              <Icon name={IconName.Diagram} color={IconColor.primaryInverse} />
            }
            label={t('portfolio')}
            onClick={() => {
              portfolioEvent();
              global.platform.openTab({
                url: mmiPortfolioUrl,
              });
            }}
          />
        )}
      </>
    );
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();
  ///: END:ONLY_INCLUDE_IF

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
              {balanceToUse ? (
                <UserPreferencedCurrencyDisplay
                  style={{ display: 'contents' }}
                  className={classnames('eth-overview__primary-balance', {
                    'eth-overview__cached-balance': balanceIsCached,
                  })}
                  data-testid="eth-overview__primary-currency"
                  value={balanceToUse}
                  type={
                    showPrimaryCurrency(
                      isOriginalNativeSymbol,
                      useNativeCurrencyAsPrimaryCurrency,
                    )
                      ? PRIMARY
                      : SECONDARY
                  }
                  showFiat={
                    !showFiat ||
                    !TEST_NETWORKS.includes(currentNetwork?.nickname)
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
          </div>
        </Tooltip>
      }
      buttons={
        <>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              Icon={
                <Icon
                  name={IconName.PlusMinus}
                  color={IconColor.primaryInverse}
                />
              }
              disabled={!isBuyableChain || !isSigningEnabled}
              data-testid="eth-overview-buy"
              label={t('buyAndSell')}
              onClick={() => {
                openBuyCryptoInPdapp();
                trackEvent({
                  event: MetaMetricsEventName.NavBuyButtonClicked,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                    text: 'Buy',
                    chain_id: chainId,
                    token_symbol: defaultSwapsToken,
                  },
                });
              }}
              tooltipRender={(contents) =>
                generateTooltip('buyButton', contents)
              }
            />
            ///: END:ONLY_INCLUDE_IF
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            renderInstitutionalButtons()
            ///: END:ONLY_INCLUDE_IF
          }

          <IconButton
            className="eth-overview__button"
            data-testid="eth-overview-send"
            Icon={
              <Icon
                name={IconName.Arrow2UpRight}
                color={IconColor.primaryInverse}
              />
            }
            disabled={!isSigningEnabled}
            label={t('send')}
            onClick={() => {
              trackEvent({
                event: MetaMetricsEventName.NavSendButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  token_symbol: 'ETH',
                  location: 'Home',
                  text: 'Send',
                  chain_id: chainId,
                },
              });
              dispatch(
                startNewDraftTransaction({ type: AssetType.native }),
              ).then(() => {
                history.push(SEND_ROUTE);
              });
            }}
            tooltipRender={(contents) =>
              generateTooltip('sendButton', contents)
            }
          />
          <IconButton
            className="eth-overview__button"
            disabled={!isSwapsChain || !isSigningEnabled}
            Icon={
              <Icon
                name={IconName.SwapHorizontal}
                color={IconColor.primaryInverse}
              />
            }
            onClick={() => {
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              global.platform.openTab({
                url: `${mmiPortfolioUrl}/swap`,
              });
              ///: END:ONLY_INCLUDE_IF

              ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
              if (isSwapsChain) {
                trackEvent({
                  event: MetaMetricsEventName.NavSwapButtonClicked,
                  category: MetaMetricsEventCategory.Swaps,
                  properties: {
                    token_symbol: 'ETH',
                    location: MetaMetricsSwapsEventSource.MainView,
                    text: 'Swap',
                    chain_id: chainId,
                  },
                });
                dispatch(setSwapsFromToken(defaultSwapsToken));
                if (usingHardwareWallet) {
                  global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
                } else {
                  history.push(BUILD_QUOTE_ROUTE);
                }
              }
              ///: END:ONLY_INCLUDE_IF
            }}
            label={t('swap')}
            data-testid="token-overview-button-swap"
            tooltipRender={(contents) =>
              generateTooltip('swapButton', contents)
            }
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              disabled={!isBridgeChain || !isSigningEnabled}
              data-testid="eth-overview-bridge"
              Icon={
                <Icon name={IconName.Bridge} color={IconColor.primaryInverse} />
              }
              label={t('bridge')}
              onClick={() => {
                if (isBridgeChain) {
                  const portfolioUrl = getPortfolioUrl(
                    'bridge',
                    'ext_bridge_button',
                    metaMetricsId,
                  );
                  global.platform.openTab({
                    url: `${portfolioUrl}${
                      location.pathname.includes('asset') ? '&token=native' : ''
                    }`,
                  });
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.BridgeLinkClicked,
                    properties: {
                      location: 'Home',
                      text: 'Bridge',
                      chain_id: chainId,
                      token_symbol: 'ETH',
                    },
                  });
                }
              }}
              tooltipRender={(contents) =>
                generateTooltip('bridgeButton', contents)
              }
            />
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              data-testid="eth-overview-portfolio"
              Icon={
                <Icon
                  name={IconName.Diagram}
                  color={IconColor.primaryInverse}
                />
              }
              label={t('portfolio')}
              onClick={() => {
                const url = getPortfolioUrl(
                  '',
                  'ext_portfolio_button',
                  metaMetricsId,
                );
                global.platform.openTab({ url });
                trackEvent({
                  category: MetaMetricsEventCategory.Navigation,
                  event: MetaMetricsEventName.PortfolioLinkClicked,
                  properties: {
                    location: 'Home',
                    text: 'Portfolio',
                    chain_id: chainId,
                    token_symbol: 'ETH',
                  },
                });
              }}
            />
            ///: END:ONLY_INCLUDE_IF
          }
        </>
      }
      className={className}
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
  showAddress: PropTypes.bool,
};

export default EthOverview;
