import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';

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
import { ButtonIcon, BUTTON_ICON_SIZES } from '../../component-library';
import { Icon, ICON_NAMES } from '../../component-library/icon/deprecated';
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
              <ButtonIcon
                className="eth-overview__portfolio-button"
                data-testid="home__portfolio-site"
                color={IconColor.primaryDefault}
                iconName={ICON_NAMES.DIAGRAM}
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
          <IconButton
            className="eth-overview__button"
            Icon={
              <Icon name={ICON_NAMES.ADD} color={IconColor.primaryInverse} />
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
          <IconButton
            className="eth-overview__button"
            data-testid="eth-overview-send"
            Icon={
              <Icon
                name={ICON_NAMES.ARROW_2_UP_RIGHT}
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
                name={ICON_NAMES.SWAP_HORIZONTAL}
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
          <IconButton
            className="eth-overview__button"
            disabled={!isBridgeChain}
            data-testid="eth-overview-bridge"
            Icon={
              <Icon name={ICON_NAMES.BRIDGE} color={IconColor.primaryInverse} />
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
        </>
      }
      className={className}
      icon={<Identicon diameter={32} image={primaryTokenImage} />}
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
