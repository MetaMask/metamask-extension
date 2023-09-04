import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IN
} from 'react-router-dom';

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
import { MMI_SWAPS_URL } from '../../../../shared/constants/swaps';
///: END:ONLY_INCLUDE_IN
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  isBalanceCached,
  getShouldShowFiat,
  getIsSwapsChain,
  getSelectedAccountCachedBalance,
  getCurrentChainId,
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getCurrentKeyring,
  getIsBridgeChain,
  getIsBuyableChain,
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IN
import IconButton from '../../ui/icon-button';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/metametrics';
import Spinner from '../../ui/spinner';
import { startNewDraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/experiences/useRamps';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IN
import WalletOverview from './wallet-overview';

const EthOverview = ({ className, showAddress }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  const location = useLocation();
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IN
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const chainId = useSelector(getCurrentChainId);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
              url: 'https://metamask-institutional.io/stake',
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
              window.open(mmiPortfolioUrl, '_blank');
            }}
          />
        )}
      </>
    );
  };
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();
  ///: END:ONLY_INCLUDE_IN

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
                  type={PRIMARY}
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
            {showFiat && balance && (
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
            ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              Icon={
                <Icon name={IconName.Add} color={IconColor.primaryInverse} />
              }
              disabled={!isBuyableChain}
              data-testid="eth-overview-buy"
              label={t('buy')}
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
            />
            ///: END:ONLY_INCLUDE_IN
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            renderInstitutionalButtons()
            ///: END:ONLY_INCLUDE_IN
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
          />
          <IconButton
            className="eth-overview__button"
            disabled={!isSwapsChain}
            Icon={
              <Icon
                name={IconName.SwapHorizontal}
                color={IconColor.primaryInverse}
              />
            }
            onClick={() => {
              ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
              global.platform.openTab({
                url: MMI_SWAPS_URL,
              });
              ///: END:ONLY_INCLUDE_IN

              ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
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
              ///: END:ONLY_INCLUDE_IN
            }}
            label={t('swap')}
            data-testid="token-overview-button-swap"
            tooltipRender={
              isSwapsChain
                ? null
                : (contents) => (
                    <Tooltip
                      title={t('currentlyUnavailable')}
                      position="bottom"
                    >
                      {contents}
                    </Tooltip>
                  )
            }
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              disabled={!isBridgeChain}
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
              tooltipRender={
                isBridgeChain
                  ? null
                  : (contents) => (
                      <Tooltip
                        title={t('currentlyUnavailable')}
                        position="bottom"
                      >
                        {contents}
                      </Tooltip>
                    )
              }
            />
            ///: END:ONLY_INCLUDE_IN
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
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
            ///: END:ONLY_INCLUDE_IN
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
