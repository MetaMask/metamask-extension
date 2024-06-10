import React, { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { CaipChainId } from '@metamask/utils';
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
  getShouldShowFiat,
  getPreferences,
  getUseExternalServices,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getCurrentKeyring,
  getMetaMetricsId,
  SwapsEthToken,
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
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { showPrimaryCurrency } from '../../../../shared/modules/currency-display.utils';
import WalletOverview from './wallet-overview';

export type CoinOverviewProps = {
  balance: string;
  balanceIsCached: boolean;
  className: string;
  classPrefix: string;
  chainId: CaipChainId | number;
  showAddress: boolean;
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  // FIXME: This seems to be for Ethereum only
  defaultSwapsToken?: SwapsEthToken;
  isBridgeChain: boolean;
  isBuyableChain: boolean;
  ///: END:ONLY_INCLUDE_IF
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
};

export const CoinOverview = ({
  balance,
  balanceIsCached,
  className,
  classPrefix = 'coin',
  chainId,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  defaultSwapsToken,
  isBridgeChain,
  isBuyableChain,
  ///: END:ONLY_INCLUDE_IF
  isSwapsChain,
  isSigningEnabled,
}: CoinOverviewProps) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  // Pre-conditions
  if (isSwapsChain && defaultSwapsToken === undefined) {
    throw new Error('defaultSwapsToken is required');
  }
  ///: END:ONLY_INCLUDE_IF

  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  ///: END:ONLY_INCLUDE_IF
  const showFiat = useSelector(getShouldShowFiat);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const { ticker, type, rpcUrl } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );

  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const buttonTooltips: Record<
    string,
    { condition: boolean; message: string }[]
  > = {
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

  const generateTooltip = (buttonKey: string, contents: React.ReactElement) => {
    const conditions = buttonTooltips[buttonKey];
    const tooltipInfo = conditions.find(({ condition }) => condition);
    if (tooltipInfo?.message) {
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

  const handleMmiStakingOnClick = useCallback(() => {
    stakingEvent();
    global.platform.openTab({
      url: `${mmiPortfolioUrl}/stake`,
    });
  }, [mmiPortfolioUrl]);

  const handleMmiPortfolioOnClick = useCallback(() => {
    portfolioEvent();
    global.platform.openTab({
      url: mmiPortfolioUrl,
    });
  }, [mmiPortfolioUrl]);

  const renderInstitutionalButtons = () => {
    return (
      <>
        <IconButton
          className={`${classPrefix}-overview__button`}
          Icon={<Icon name={IconName.Stake} color={IconColor.primaryInverse} />}
          label={t('stake')}
          onClick={handleMmiStakingOnClick}
        />
        {mmiPortfolioEnabled && (
          <IconButton
            className={`${classPrefix}-overview__button`}
            Icon={
              <Icon name={IconName.Diagram} color={IconColor.primaryInverse} />
            }
            label={t('portfolio')}
            onClick={handleMmiPortfolioOnClick}
          />
        )}
      </>
    );
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();
  ///: END:ONLY_INCLUDE_IF

  const handleSendOnClick = useCallback(async () => {
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
    // FIXME: .then does exist on dispatch, so use await here?
    await dispatch(startNewDraftTransaction({ type: AssetType.native }));
    history.push(SEND_ROUTE);
  }, [chainId]);

  const handleSwapOnClick = useCallback(async () => {
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
        if (global.platform.openExtensionInBrowser) {
          global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
        }
      } else {
        history.push(BUILD_QUOTE_ROUTE);
      }
    }
    ///: END:ONLY_INCLUDE_IF
  }, [
    isSwapsChain,
    chainId,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    usingHardwareWallet,
    defaultSwapsToken,
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiPortfolioUrl,
    ///: END:ONLY_INCLUDE_IF
  ]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const handleBuyAndSellOnClick = useCallback(() => {
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
  }, [chainId, defaultSwapsToken]);

  const handleBridgeOnClick = useCallback(() => {
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
  }, [isBridgeChain, chainId, metaMetricsId]);

  const handlePortfolioOnClick = useCallback(() => {
    const url = getPortfolioUrl('', 'ext_portfolio_button', metaMetricsId);
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
  }, [chainId, metaMetricsId]);
  ///: END:ONLY_INCLUDE_IF

  return (
    <WalletOverview
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className={`${classPrefix}-overview__balance`}>
            <div className={`${classPrefix}-overview__primary-container`}>
              {balance ? (
                <UserPreferencedCurrencyDisplay
                  style={{ display: 'contents' }}
                  className={classnames(
                    `${classPrefix}-overview__primary-balance`,
                    {
                      [`${classPrefix}-overview__cached-balance`]:
                        balanceIsCached,
                    },
                  )}
                  data-testid={`${classPrefix}-overview__primary-currency`}
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
              {balanceIsCached && (
                <span className={`${classPrefix}-overview__cached-star`}>
                  *
                </span>
              )}
            </div>
            {showFiat && isOriginalNativeSymbol && balance && (
              <UserPreferencedCurrencyDisplay
                className={classnames({
                  [`${classPrefix}__cached-secondary-balance`]: balanceIsCached,
                  [`${classPrefix}__secondary-balance`]: !balanceIsCached,
                })}
                data-testid={`${classPrefix}-overview__secondary-currency`}
                value={balance}
                type={SECONDARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
            )}
          </div>
        </Tooltip>
      }
      buttons={
        <>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className={`${classPrefix}-overview__button`}
              Icon={
                <Icon
                  name={IconName.PlusMinus}
                  color={IconColor.primaryInverse}
                />
              }
              disabled={!isBuyableChain || !isSigningEnabled}
              data-testid={`${classPrefix}-overview-buy`}
              label={t('buyAndSell')}
              onClick={handleBuyAndSellOnClick}
              tooltipRender={(contents: React.ReactElement) =>
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
            className={`${classPrefix}-overview__button`}
            data-testid={`${classPrefix}-overview-send`}
            Icon={
              <Icon
                name={IconName.Arrow2UpRight}
                color={IconColor.primaryInverse}
              />
            }
            disabled={!isSigningEnabled}
            label={t('send')}
            onClick={handleSendOnClick}
            tooltipRender={(contents: React.ReactElement) =>
              generateTooltip('sendButton', contents)
            }
          />
          <IconButton
            className={`${classPrefix}-overview__button`}
            disabled={
              !isSwapsChain || !isSigningEnabled || !isExternalServicesEnabled
            }
            Icon={
              <Icon
                name={IconName.SwapHorizontal}
                color={IconColor.primaryInverse}
              />
            }
            onClick={handleSwapOnClick}
            label={t('swap')}
            data-testid="token-overview-button-swap"
            tooltipRender={(contents: React.ReactElement) =>
              generateTooltip('swapButton', contents)
            }
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className={`${classPrefix}-overview__button`}
              disabled={!isBridgeChain || !isSigningEnabled}
              data-testid={`${classPrefix}-overview-bridge`}
              Icon={
                <Icon name={IconName.Bridge} color={IconColor.primaryInverse} />
              }
              label={t('bridge')}
              onClick={handleBridgeOnClick}
              tooltipRender={(contents: React.ReactElement) =>
                generateTooltip('bridgeButton', contents)
              }
            />
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className={`${classPrefix}-overview__button`}
              data-testid={`${classPrefix}-overview-portfolio`}
              Icon={
                <Icon
                  name={IconName.Diagram}
                  color={IconColor.primaryInverse}
                />
              }
              label={t('portfolio')}
              onClick={handlePortfolioOnClick}
            />
            ///: END:ONLY_INCLUDE_IF
          }
        </>
      }
      className={className}
    />
  );
};
