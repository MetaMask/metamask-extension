import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { startNewDraftTransaction } from '../../../ducks/send';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import useRamps from '../../../hooks/experiences/useRamps';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import {
  getIsSwapsChain,
  getCurrentChainId,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getIsBridgeChain,
  getCurrentKeyring,
  getIsBuyableChain,
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';

import IconButton from '../../ui/icon-button';
import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';

import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';

import { useIsOriginalTokenSymbol } from '../../../hooks/useIsOriginalTokenSymbol';
import WalletOverview from './wallet-overview';

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const { tokensWithBalances } = useTokenTracker({ tokens: [token] });
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  const balance = tokensWithBalances[0]?.balance;
  ///: END:ONLY_INCLUDE_IF
  const balanceToRender = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );

  const isOriginalTokenSymbol = useIsOriginalTokenSymbol(
    token.address,
    token.symbol,
  );
  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const metaMetricsId = useSelector(getMetaMetricsId);

  const { openBuyCryptoInPdapp } = useRamps();
  ///: END:ONLY_INCLUDE_IF

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
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    if (token.isERC721) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);

  return (
    <WalletOverview
      showAddress={false}
      balance={
        <div className="token-overview__balance">
          <div className="token-overview__primary-container">
            <CurrencyDisplay
              style={{ display: 'contents' }}
              className="token-overview__primary-balance"
              displayValue={balanceToRender}
              suffix={token.symbol}
            />
          </div>
          {formattedFiatBalance && isOriginalTokenSymbol ? (
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
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="token-overview__button"
              Icon={
                <Icon
                  name={IconName.PlusMinus}
                  color={IconColor.primaryInverse}
                />
              }
              label={t('buyAndSell')}
              data-testid="token-overview-buy"
              onClick={() => {
                openBuyCryptoInPdapp();
                trackEvent({
                  event: MetaMetricsEventName.NavBuyButtonClicked,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Token Overview',
                    text: 'Buy',
                    chain_id: chainId,
                    token_symbol: token.symbol,
                  },
                });
              }}
              disabled={token.isERC721 || !isBuyableChain}
            />
            ///: END:ONLY_INCLUDE_IF
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            <>
              <IconButton
                className="eth-overview__button"
                Icon={
                  <Icon
                    name={IconName.Stake}
                    color={IconColor.primaryInverse}
                  />
                }
                label={t('stake')}
                data-testid="token-overview-mmi-stake"
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
                    <Icon
                      name={IconName.Diagram}
                      color={IconColor.primaryInverse}
                    />
                  }
                  label={t('portfolio')}
                  data-testid="token-overview-mmi-portfolio"
                  onClick={() => {
                    portfolioEvent();
                    global.platform.openTab({
                      url: mmiPortfolioUrl,
                    });
                  }}
                />
              )}
            </>
            ///: END:ONLY_INCLUDE_IF
          }

          <IconButton
            className="token-overview__button"
            onClick={async () => {
              trackEvent({
                event: MetaMetricsEventName.NavSendButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  token_symbol: token.symbol,
                  location: MetaMetricsSwapsEventSource.TokenView,
                  text: 'Send',
                  chain_id: chainId,
                },
              });
              try {
                await dispatch(
                  startNewDraftTransaction({
                    type: AssetType.token,
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
            Icon={
              <Icon
                name={IconName.Arrow2UpRight}
                color={IconColor.primaryInverse}
              />
            }
            label={t('send')}
            data-testid="eth-overview-send"
            disabled={token.isERC721}
          />
          {isSwapsChain && (
            <IconButton
              className="token-overview__button"
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
                trackEvent({
                  event: MetaMetricsEventName.NavSwapButtonClicked,
                  category: MetaMetricsEventCategory.Swaps,
                  properties: {
                    token_symbol: token.symbol,
                    location: MetaMetricsSwapsEventSource.TokenView,
                    text: 'Swap',
                    chain_id: chainId,
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
                ///: END:ONLY_INCLUDE_IF
              }}
              label={t('swap')}
              tooltipRender={null}
            />
          )}

          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            isBridgeChain && (
              <IconButton
                className="token-overview__button"
                data-testid="token-overview-bridge"
                Icon={
                  <Icon
                    name={IconName.Bridge}
                    color={IconColor.primaryInverse}
                  />
                }
                label={t('bridge')}
                onClick={() => {
                  const portfolioUrl = getPortfolioUrl(
                    'bridge',
                    'ext_bridge_button',
                    metaMetricsId,
                  );
                  global.platform.openTab({
                    url: `${portfolioUrl}&token=${token.address}`,
                  });
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.BridgeLinkClicked,
                    properties: {
                      location: 'Token Overview',
                      text: 'Bridge',
                      url: portfolioUrl,
                      chain_id: chainId,
                      token_symbol: token.symbol,
                    },
                  });
                }}
                tooltipRender={null}
              />
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </>
      }
      className={className}
    />
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
