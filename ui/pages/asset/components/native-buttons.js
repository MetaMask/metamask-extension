import React, { useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import {
  getIsSwapsChain,
  getCurrentChainId,
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
///: END:ONLY_INCLUDE_IF
import IconButton from '../../../components/ui/icon-button';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/constants/metametrics';
import { startNewDraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import Tooltip from '../../../components/ui/tooltip';
import { Box, Icon, IconName } from '../../../components/component-library';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useRamps from '../../../hooks/experiences/useRamps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IF

const NativeButtons = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const location = useLocation();
  const t = useContext(I18nContext);

  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const isBridgeChain = useSelector(getIsBridgeChain);

  const metaMetricsId = useSelector(getMetaMetricsId);

  const chainId = useSelector(getCurrentChainId);
  const trackEvent = useContext(MetaMetricsContext);

  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();
  ///: END:ONLY_INCLUDE_IF

  const isSigningEnabled = true;
  const isExternalServicesEnabled = true;

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

  return (
    <Box
      marginTop={4}
      marginLeft={4}
      marginRight={4}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceAround}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className="eth-overview__button"
          Icon={
            <Icon name={IconName.PlusMinus} color={IconColor.primaryInverse} />
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
          tooltipRender={(contents) => generateTooltip('buyButton', contents)}
        />
        ///: END:ONLY_INCLUDE_IF
      }

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        // renderInstitutionalButtons()
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
          dispatch(startNewDraftTransaction({ type: AssetType.native })).then(
            () => {
              history.push(SEND_ROUTE);
            },
          );
        }}
        tooltipRender={(contents) => generateTooltip('sendButton', contents)}
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
          // global.platform.openTab({
          //   url: `${mmiPortfolioUrl}/swap`,
          // });
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
        tooltipRender={(contents) => generateTooltip('swapButton', contents)}
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
            <Icon name={IconName.Diagram} color={IconColor.primaryInverse} />
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
    </Box>
  );
};

export default NativeButtons;
