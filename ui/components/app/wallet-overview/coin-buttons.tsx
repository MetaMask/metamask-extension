import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { toHex } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IF
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isCaipChainId,
  ///: END:ONLY_INCLUDE_IF
  CaipChainId,
} from '@metamask/utils';

///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { ChainId } from '../../../../shared/constants/network';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import { I18nContext } from '../../../contexts/i18n';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  SEND_ROUTE,
} from '../../../helpers/constants/routes';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  SwapsEthToken,
  getCurrentKeyring,
  ///: END:ONLY_INCLUDE_IF
  getUseExternalServices,
  getSelectedAccount,
} from '../../../selectors';
import Tooltip from '../../ui/tooltip';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IF
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { startNewDraftTransaction } from '../../../ducks/send';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName } from '../../component-library';
import IconButton from '../../ui/icon-button';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import useBridging from '../../../hooks/bridge/useBridging';
import { ReceiveModal } from '../../multichain/receive-modal';
///: END:ONLY_INCLUDE_IF

const CoinButtons = ({
  chainId,
  isSwapsChain,
  isSigningEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isBridgeChain,
  isBuyableChain,
  defaultSwapsToken,
  ///: END:ONLY_INCLUDE_IF
  classPrefix = 'coin',
}: {
  chainId: `0x${string}` | CaipChainId | number;
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isBridgeChain: boolean;
  isBuyableChain: boolean;
  defaultSwapsToken?: SwapsEthToken;
  ///: END:ONLY_INCLUDE_IF
  classPrefix?: string;
}) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const trackEvent = useContext(MetaMetricsContext);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const { address: selectedAddress } = useSelector(getSelectedAccount);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  ///: END:ONLY_INCLUDE_IF

  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const buttonTooltips = {
    buyButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !isBuyableChain, message: '' },
      ///: END:ONLY_INCLUDE_IF
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

  const generateTooltip = (
    buttonKey: keyof typeof buttonTooltips,
    contents: React.ReactElement,
  ) => {
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

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const getChainId = (): CaipChainId | ChainId => {
    if (isCaipChainId(chainId)) {
      return chainId as CaipChainId;
    }
    // Otherwise we assume that's an EVM chain ID, so use the usual 0x prefix
    return toHex(chainId) as ChainId;
  };
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

  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

  const handleSendOnClick = useCallback(async () => {
    trackEvent(
      {
        event: MetaMetricsEventName.NavSendButtonClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          token_symbol: 'ETH',
          location: 'Home',
          text: 'Send',
          chain_id: chainId,
        },
      },
      { excludeMetaMetricsId: false },
    );
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
    openBuyCryptoInPdapp(getChainId());
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
    if (!defaultSwapsToken) {
      return;
    }
    openBridgeExperience(
      'Home',
      defaultSwapsToken,
      location.pathname.includes('asset') ? '&token=native' : '',
    );
  }, [defaultSwapsToken, location, openBridgeExperience]);
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className={`${classPrefix}-overview__button`}
          Icon={
            <Icon name={IconName.PlusMinus} color={IconColor.primaryInverse} />
          }
          disabled={!isBuyableChain}
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
      {
        <>
          {showReceiveModal && (
            <ReceiveModal
              address={selectedAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          )}
          <IconButton
            className={`${classPrefix}-overview__button`}
            data-testid={`${classPrefix}-overview-receive`}
            Icon={
              <Icon
                name={IconName.ScanBarcode}
                color={IconColor.primaryInverse}
              />
            }
            label={t('receive')}
            onClick={() => {
              setShowReceiveModal(true);
            }}
          />
        </>
      }
    </Box>
  );
};

export default CoinButtons;
