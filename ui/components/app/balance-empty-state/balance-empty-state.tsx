import React, { useCallback, useContext, useEffect, useState } from 'react';
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
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { getMultichainCurrentNetwork } from '../../../selectors/multichain';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';

import { FundingMethodModal } from '../../multichain/funding-method-modal/funding-method-modal';

export type BalanceEmptyStateProps = {
  /**
   * Test ID for component testing
   */
  testID?: string;
  /**
   * Additional className to apply to the component
   */
  className?: string;
  /**
   * Callback function to handle receive crypto action
   */
  onClickReceive?: () => void;
};

export const BalanceEmptyState: React.FC<BalanceEmptyStateProps> = ({
  onClickReceive,
  ...props
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const currentLocale = useSelector(getCurrentLocale);
  const chainId = useSelector(getCurrentChainId);
  const { nickname } = useSelector(getMultichainCurrentNetwork);

  const [isModalOpen, setIsModalOpen] = useState(false);

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

    setIsModalOpen(true);
  }, [chainId, trackEvent]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle receive crypto option
  const handleReceive = useCallback(() => {
    // Close modal and handle receive flow
    setIsModalOpen(false);
    // Always call the onClickReceive callback
    onClickReceive?.();
  }, [onClickReceive]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      gap={5}
      {...props}
      className={twMerge('rounded-lg', props.className)}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={1}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
        >
          <img
            src="./images/bank-transfer.png"
            alt={t('fundYourWallet')}
            width="100"
            height="100"
          />
        </Box>
        <Text
          variant={TextVariant.HeadingLg}
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
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleAction}
        isFullWidth
      >
        {t('addFunds')}
      </Button>
      <FundingMethodModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={t('addFunds')}
        onClickReceive={handleReceive}
        data-testid="balance-empty-state-funding-modal"
      />
    </Box>
  );
};
