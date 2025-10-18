import React, { useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  Button,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  ButtonVariant,
  ButtonSize,
  twMerge,
} from '@metamask/design-system-react';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { getMultichainCurrentNetwork } from '../../../selectors/multichain';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useRamps, {
  RampsMetaMaskEntry,
} from '../../../hooks/ramps/useRamps/useRamps';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { ChainId } from '../../../../shared/constants/network';

export type BalanceEmptyStateProps = {
  /**
   * Test ID for component testing
   */
  testID?: string;
  /**
   * Additional className to apply to the component
   */
  className?: string;
};

export const BalanceEmptyState: React.FC<BalanceEmptyStateProps> = (props) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const currentLocale = useSelector(getCurrentLocale);
  const chainId = useSelector(getCurrentChainId);
  const { nickname } = useSelector(getMultichainCurrentNetwork);

  const { openBuyCryptoInPdapp } = useRamps(RampsMetaMaskEntry.TokensBanner);

  // Track when component is displayed
  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.EmptyBuyBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        locale: currentLocale,
        network: nickname,
        referrer: ORIGIN_METAMASK,
        location: 'balance_empty_state',
      },
    });
  }, [currentLocale, chainId, nickname, trackEvent]);

  // Handle action button click
  const handleAction = useCallback(() => {
    // Track button click events
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'balance_empty_state',
        text: 'Add funds',
        chainId,
      },
    });

    openBuyCryptoInPdapp(chainId as ChainId | CaipChainId);
  }, [chainId, openBuyCryptoInPdapp, trackEvent]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      margin={4}
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      gap={4}
      {...props}
      className={twMerge('rounded-lg', props.className)}
    >
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <img
          src="./images/bank-transfer.png"
          alt={t('fundYourWallet')}
          width="100"
          height="100"
        />
      </Box>
      <Text
        variant={TextVariant.HeadingMd}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
        textAlign={TextAlign.Center}
      >
        {t('fundYourWallet')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        textAlign={TextAlign.Center}
      >
        {t('getYourWalletReadyToUseWeb3')}
      </Text>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleAction}
        isFullWidth
      >
        {t('addFunds')}
      </Button>
    </Box>
  );
};
