import React, { useContext, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { zeroAddress } from 'ethereumjs-util';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import {
  getDataCollectionForMarketing,
  getShouldShowAggregatedBalancePopover,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
  getIsTestnet,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  SwapsEthToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import Spinner from '../../ui/spinner';

import { PercentageAndAmountChange } from '../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { setAggregatedBalancePopover } from '../../../store/actions';
import { useTheme } from '../../../hooks/useTheme';
import { getSpecificSettingsRoute } from '../../../helpers/utils/settings-search';
import WalletOverview from './wallet-overview';
import CoinButtons from './coin-buttons';
import { AggregatedPercentageOverview } from './aggregated-percentage-overview';

export type CoinOverviewProps = {
  balance: string;
  balanceIsCached: boolean;
  className?: string;
  classPrefix?: string;
  chainId: CaipChainId | Hex;
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

  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const showNativeTokenAsMainBalanceRoute = getSpecificSettingsRoute(
    t,
    t('general'),
    t('showNativeTokenAsMainBalance'),
  );

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const theme = useTheme();

  const shouldShowPopover = useSelector(getShouldShowAggregatedBalancePopover);
  const isTestnet = useSelector(getIsTestnet);

  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const { showNativeTokenAsMainBalance } = useSelector(getPreferences);

  const isEvm = useSelector(getMultichainIsEvm);
  const balanceToDisplay =
    showNativeTokenAsMainBalance || isTestnet || !isEvm
      ? balance
      : totalFiatBalance;

  const tokensMarketData = useSelector(getTokensMarketData);
  const [isOpen, setIsOpen] = useState(true);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    dispatch(setAggregatedBalancePopover());
  };

  const [referenceElement, setReferenceElement] = useState();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setBoxRef = (ref: any) => {
    setReferenceElement(ref);
  };

  const handlePortfolioOnClick = useCallback(() => {
    const url = getPortfolioUrl(
      '',
      'ext_portfolio_button',
      metaMetricsId,
      isMetaMetricsEnabled,
      isMarketingEnabled,
    );
    global.platform.openTab({ url });
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PortfolioLinkClicked,
      properties: {
        location: 'Home',
        text: 'Portfolio',
      },
    });
  }, [isMarketingEnabled, isMetaMetricsEnabled, metaMetricsId, trackEvent]);

  const renderPercentageAndAmountChange = () => {
    if (isEvm) {
      if (showNativeTokenAsMainBalance) {
        return (
          <Box className="wallet-overview__currency-wrapper">
            <PercentageAndAmountChange
              value={tokensMarketData?.[zeroAddress()]?.pricePercentChange1d}
            />
            <ButtonLink
              endIconName={IconName.Export}
              endIconProps={{
                size: IconSize.Sm,
                color: IconColor.primaryDefault,
                marginLeft: 2,
              }}
              size={ButtonLinkSize.Inherit}
              onClick={handlePortfolioOnClick}
              as="a"
              data-testid="portfolio-link"
              className="wallet-overview__portfolio_text"
            >
              {t('portfolio')}
            </ButtonLink>
          </Box>
        );
      }
      return (
        <Box className="wallet-overview__currency-wrapper">
          <AggregatedPercentageOverview />
          <ButtonLink
            endIconName={IconName.Export}
            endIconProps={{
              size: IconSize.Sm,
              color: IconColor.primaryDefault,
              marginLeft: 2,
            }}
            size={ButtonLinkSize.Inherit}
            onClick={handlePortfolioOnClick}
            as="a"
            data-testid="portfolio-link"
            className="wallet-overview__portfolio_text"
          >
            {t('portfolio')}
          </ButtonLink>
        </Box>
      );
    }
    return null;
  };

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
              {balanceToDisplay ? (
                <>
                  <Box onMouseEnter={handleMouseEnter} ref={setBoxRef}>
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
                      value={balanceToDisplay}
                      type={PRIMARY}
                      ethNumberOfDecimals={4}
                      hideTitle
                      shouldCheckShowNativeToken
                      isAggregatedFiatOverviewBalance={
                        !showNativeTokenAsMainBalance && !isTestnet
                      }
                    />
                  </Box>
                  {shouldShowPopover &&
                  !isTestnet &&
                  !showNativeTokenAsMainBalance ? (
                    <Popover
                      referenceElement={referenceElement}
                      isOpen={isOpen}
                      position={PopoverPosition.BottomStart} // TODO check with design-team about this bottom start issue
                      hasArrow
                      flip
                      data-theme={theme === 'light' ? 'dark' : 'light'}
                      className="balance-popover__container"
                      padding={3}
                      onClickOutside={handleClick}
                      onPressEscKey={handleClick}
                      preventOverflow
                    >
                      <Box>
                        <Box
                          display={Display.Flex}
                          justifyContent={JustifyContent.spaceBetween}
                        >
                          <Text
                            variant={TextVariant.bodySmBold}
                            textAlign={TextAlign.Left}
                            alignItems={AlignItems.flexStart}
                            className="balance-popover__text"
                          >
                            {t('yourBalanceIsAggregated')}
                          </Text>
                          <ButtonIcon
                            size={ButtonIconSize.Xs}
                            onClick={handleClick}
                            iconName={IconName.Close}
                            justifyContent={JustifyContent.center}
                            ariaLabel="close"
                          />
                        </Box>

                        <Text
                          variant={TextVariant.bodySm}
                          className="balance-popover__text"
                        >
                          {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore: Expected 0-1 arguments, but got 2.
                            t('aggregatedBalancePopover', [
                              <ButtonLink
                                size={ButtonLinkSize.Inherit}
                                textProps={{
                                  variant: TextVariant.bodyMd,
                                  alignItems: AlignItems.flexStart,
                                }}
                                as="a"
                                href={`#${showNativeTokenAsMainBalanceRoute.route}`}
                                rel="noopener noreferrer"
                                onClick={handleClick}
                              >
                                {t('settings')}
                              </ButtonLink>,
                            ])
                          }
                        </Text>
                      </Box>
                    </Popover>
                  ) : null}
                </>
              ) : (
                <Spinner className="loading-overlay__spinner" />
              )}
              {balanceIsCached && (
                <span className={`${classPrefix}-overview__cached-star`}>
                  *
                </span>
              )}
            </div>
            {renderPercentageAndAmountChange()}
          </div>
        </Tooltip>
      }
      buttons={
        <CoinButtons
          {...{
            trackingLocation: 'home',
            chainId,
            isSwapsChain,
            isSigningEnabled,
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            isBridgeChain,
            isBuyableChain,
            defaultSwapsToken,
            ///: END:ONLY_INCLUDE_IF
            classPrefix,
            iconButtonClassName: `${classPrefix}-overview__icon-button`,
          }}
        />
      }
      className={className}
    />
  );
};
