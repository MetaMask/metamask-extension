import React, {
  useContext,
  useState,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useCallback,
  ///: END:ONLY_INCLUDE_IF
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { zeroAddress } from 'ethereumjs-util';
import { CaipChainId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { InternalAccount } from '@metamask/keyring-api';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextAlign,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF

import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import {
  getPreferences,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
  getIsTestnet,
  getShouldShowAggregatedBalancePopover,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  SwapsEthToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import Spinner from '../../ui/spinner';

import { PercentageAndAmountChange } from '../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import {
  setAggregatedBalancePopoverShown,
  setPrivacyMode,
} from '../../../store/actions';
import { useTheme } from '../../../hooks/useTheme';
import { getSpecificSettingsRoute } from '../../../helpers/utils/settings-search';
import { useI18nContext } from '../../../hooks/useI18nContext';
import WalletOverview from './wallet-overview';
import CoinButtons from './coin-buttons';
import { AggregatedPercentageOverview } from './aggregated-percentage-overview';

export type CoinOverviewProps = {
  account: InternalAccount;
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
  account,
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

  const t: ReturnType<typeof useI18nContext> = useContext(I18nContext);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  ///: END:ONLY_INCLUDE_IF

  const showNativeTokenAsMainBalanceRoute = getSpecificSettingsRoute(
    t,
    t('general'),
    t('showNativeTokenAsMainBalance'),
  );
  const theme = useTheme();
  const dispatch = useDispatch();

  const shouldShowPopover = useSelector(getShouldShowAggregatedBalancePopover);
  const isTestnet = useSelector(getIsTestnet);
  const { showFiatInTestnets, privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { totalFiatBalance, loading } = useAccountTotalFiatBalance(
    account,
    shouldHideZeroBalanceTokens,
  );

  const isEvm = useSelector(getMultichainIsEvm);
  const isNotAggregatedFiatBalance =
    showNativeTokenAsMainBalance || isTestnet || !isEvm;
  let balanceToDisplay;
  if (isNotAggregatedFiatBalance) {
    balanceToDisplay = balance;
  } else if (!loading) {
    balanceToDisplay = totalFiatBalance;
  }

  const tokensMarketData = useSelector(getTokensMarketData);
  const [isOpen, setIsOpen] = useState(true);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    dispatch(setAggregatedBalancePopoverShown());
  };

  const handleSensitiveToggle = () => {
    dispatch(setPrivacyMode(!privacyMode));
  };

  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);
  const setBoxRef = (ref: HTMLSpanElement | null) => {
    if (ref) {
      setReferenceElement(ref);
    }
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
  ///: END:ONLY_INCLUDE_IF

  const renderPercentageAndAmountChange = () => {
    if (isEvm) {
      if (showNativeTokenAsMainBalance) {
        return (
          <Box className="wallet-overview__currency-wrapper">
            <PercentageAndAmountChange
              value={tokensMarketData?.[zeroAddress()]?.pricePercentChange1d}
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
              <ButtonLink
                endIconName={IconName.Export}
                onClick={handlePortfolioOnClick}
                as="a"
                data-testid="portfolio-link"
                textProps={{ variant: TextVariant.bodyMdMedium }}
              >
                {t('portfolio')}
              </ButtonLink>
              ///: END:ONLY_INCLUDE_IF
            }
          </Box>
        );
      }
      return (
        <Box className="wallet-overview__currency-wrapper">
          <AggregatedPercentageOverview />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <ButtonLink
              endIconName={IconName.Export}
              onClick={handlePortfolioOnClick}
              as="a"
              data-testid="portfolio-link"
              textProps={{ variant: TextVariant.bodyMdMedium }}
            >
              {t('portfolio')}
            </ButtonLink>
            ///: END:ONLY_INCLUDE_IF
          }
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
            <div
              className={`${classPrefix}-overview__primary-container`}
              onMouseEnter={handleMouseEnter}
              ref={setBoxRef}
            >
              {balanceToDisplay ? (
                <>
                  <UserPreferencedCurrencyDisplay
                    style={{ display: 'contents' }}
                    account={account}
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
                    privacyMode={privacyMode}
                  />
                  <ButtonIcon
                    color={IconColor.iconAlternative}
                    marginLeft={2}
                    size={ButtonIconSize.Md}
                    onClick={handleSensitiveToggle}
                    iconName={privacyMode ? IconName.EyeSlash : IconName.Eye}
                    justifyContent={JustifyContent.center}
                    ariaLabel="Sensitive toggle"
                    data-testid="sensitive-toggle"
                  />
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
            {shouldShowPopover &&
            (!isTestnet || (isTestnet && showFiatInTestnets)) &&
            !showNativeTokenAsMainBalance ? (
              <Popover
                referenceElement={referenceElement}
                isOpen={isOpen}
                position={PopoverPosition.BottomStart}
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
                    >
                      {t('yourBalanceIsAggregated')}
                    </Text>
                    <ButtonIcon
                      size={ButtonIconSize.Sm}
                      onClick={handleClick}
                      iconName={IconName.Close}
                      justifyContent={JustifyContent.center}
                      ariaLabel="close"
                      data-testid="popover-close"
                    />
                  </Box>

                  <Text variant={TextVariant.bodySm}>
                    {t('aggregatedBalancePopover', [
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
                    ])}
                  </Text>
                </Box>
              </Popover>
            ) : null}

            {renderPercentageAndAmountChange()}
          </div>
        </Tooltip>
      }
      buttons={
        <CoinButtons
          {...{
            account,
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
