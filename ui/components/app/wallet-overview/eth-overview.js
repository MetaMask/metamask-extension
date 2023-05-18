import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN

import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  isBalanceCached,
  getShouldShowFiat,
  getCurrentKeyring,
  getSwapsDefaultToken,
  getIsSwapsChain,
  getIsBridgeChain,
  getIsBuyableChain,
  getSelectedAccountCachedBalance,
  getCurrentChainId,
  getMetaMetricsId,
} from '../../../selectors';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import IconButton from '../../ui/icon-button';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import Spinner from '../../ui/spinner';
import { startNewDraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
} from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import useRamps from '../../../hooks/experiences/useRamps';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import WalletOverview from './wallet-overview';

const EthOverview = ({ className }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const location = useLocation();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const chainId = useSelector(getCurrentChainId);
  const metaMetricsId = useSelector(getMetaMetricsId);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const portfolioEvent = () => {
    trackEvent({
      category: 'Navigation',
      event: 'Clicked Portfolio Button',
    });
  };

  const stakingEvent = () => {
    trackEvent({
      category: 'Navigation',
      event: 'Clicked Stake Button',
    });
  };

  const renderInstitutionalButtons = () => {
    return (
      <>
        <IconButton
          className="eth-overview__button"
          Icon={<Icon name={IconName.Stake} color={IconColor.primaryDefault} />}
          label={t('stake')}
          onClick={() => {
            stakingEvent();
            global.platform.openTab({
              url: 'https://metamask-institutional.io/staking',
            });
          }}
        />
        {mmiPortfolioEnabled && (
          <IconButton
            className="eth-overview__button"
            Icon={
              <Icon name={IconName.Diagram} color={IconColor.primaryDefault} />
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

  const { openBuyCryptoInPdapp } = useRamps();

  return (
    <WalletOverview
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
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
                <ButtonIcon
                  className="eth-overview__portfolio-button"
                  data-testid="home__portfolio-site"
                  color={IconColor.primaryDefault}
                  iconName={IconName.Diagram}
                  ariaLabel={t('portfolio')}
                  size={ButtonIconSize.Lg}
                  onClick={() => {
                    const portfolioUrl = getPortfolioUrl(
                      '',
                      'ext',
                      metaMetricsId,
                    );
                    global.platform.openTab({
                      url: portfolioUrl,
                    });
                    trackEvent(
                      {
                        category: MetaMetricsEventCategory.Home,
                        event: MetaMetricsEventName.PortfolioLinkClicked,
                        properties: {
                          url: portfolioUrl,
                        },
                      },
                      {
                        contextPropsIntoEventProperties: [
                          MetaMetricsContextProp.PageTitle,
                        ],
                      },
                    );
                  }}
                />
                ///: END:ONLY_INCLUDE_IN
              }
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
            }}
            label={t('swap')}
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
        </>
      }
      className={className}
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
};

EthOverview.defaultProps = {
  className: undefined,
};

export default EthOverview;
