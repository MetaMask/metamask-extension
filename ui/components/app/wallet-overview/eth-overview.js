import React, { useContext, useEffect, useState } from 'react';
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
import { ApprovalType } from '@metamask/controller-utils';
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
  CONFIRMATION_V_NEXT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  isBalanceCached,
  getShouldShowFiat,
  getIsSwapsChain,
  getCurrentChainId,
  getPreferences,
  getSelectedInternalAccount,
  getSelectedAccountCachedBalance,
  getUseExternalServices,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getCurrentKeyring,
  getIsBridgeChain,
  getIsBuyableChain,
  getMetaMetricsId,
  getIsFaucetBuyableChain,
  getMemoizedUnapprovedTemplatedConfirmations,
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
import { getFaucetProvidersByChain } from '../../../store/actions';
import WalletOverview from './wallet-overview';
import ModalFaucet from './modal-faucet';

const EthOverview = ({ className, showAddress }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const isBuyableTestChain = useSelector(getIsFaucetBuyableChain);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IF
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

  const account = useSelector(getSelectedInternalAccount);
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  const [faucetSnapId] = useState('local:http://localhost:8080');
  const [faucetProviders, setFaucetProviders] = useState([]);
  const [showModalFaucet, setShowModalFaucet] = useState(false);

  useEffect(() => {
    // Snaps are allowed to redirect to their own pending confirmations (templated or not)
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === faucetSnapId,
    );

    if (
      templatedSnapApproval &&
      templatedSnapApproval.type === ApprovalType.SnapDialogAlert
    ) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, faucetSnapId, history]);

  const buttonTooltips = {
    buyButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !(isBuyableChain || !isBuyableTestChain), message: '' },
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
              onClick={async () => {
                if (isBuyableChain) {
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
                }
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
            disabled={
              !isSwapsChain || !isSigningEnabled || !isExternalServicesEnabled
            }
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
            isBuyableTestChain && (
              <>
                <IconButton
                  className="eth-overview__button"
                  Icon={
                    <Icon
                      name={IconName.WalletMoney}
                      color={IconColor.primaryInverse}
                    />
                  }
                  disabled={!isSigningEnabled}
                  data-testid="eth-overview-faucet"
                  label="Faucet"
                  onClick={async () => {
                    const providers = await dispatch(
                      getFaucetProvidersByChain(chainId),
                    );

                    console.log('eth-overview: providers: ', providers);

                    setFaucetProviders(providers);
                    setShowModalFaucet(true);
                  }}
                  tooltipRender={(contents) =>
                    generateTooltip('buyButton', contents)
                  }
                />
                {showModalFaucet && (
                  <ModalFaucet
                    accountAddress={account.address}
                    chainId={chainId}
                    faucetSnapSourceIds={faucetProviders}
                    onClose={() => {
                      setShowModalFaucet(false);
                    }}
                  />
                )}
              </>
            )
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
