import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';

///: BEGIN:ONLY_INCLUDE_IN(mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN

import Identicon from '../../ui/identicon';
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
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
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
  BUTTON_ICON_SIZES,
} from '../../component-library/button-icon/deprecated';
import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import useRamps from '../../../hooks/experiences/useRamps';
import WalletOverview from './wallet-overview';

const EthOverview = ({ className }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
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
      loading={!balance}
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
                ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
                <ButtonIcon
                  className="eth-overview__portfolio-button"
                  data-testid="home__portfolio-site"
                  color={IconColor.primaryDefault}
                  iconName={IconName.Diagram}
                  ariaLabel={t('portfolio')}
                  size={BUTTON_ICON_SIZES.LG}
                  onClick={() => {
                    const portfolioUrl = process.env.PORTFOLIO_URL;
                    global.platform.openTab({
                      url: `${portfolioUrl}?metamaskEntry=ext`,
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
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
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
                  },
                });
              }}
            />
            ///: END:ONLY_INCLUDE_IN
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IN(mmi)
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
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
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
                  const portfolioUrl = process.env.PORTFOLIO_URL;
                  const bridgeUrl = `${portfolioUrl}/bridge`;
                  global.platform.openTab({
                    url: `${bridgeUrl}?metamaskEntry=ext`,
                  });
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.BridgeLinkClicked,
                    properties: {
                      location: 'Home',
                      text: 'Bridge',
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
      icon={<Identicon diameter={32} image={primaryTokenImage} imageBorder />}
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
