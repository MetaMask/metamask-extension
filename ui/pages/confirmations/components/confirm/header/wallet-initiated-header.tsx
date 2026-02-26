import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SHIELD_PLAN_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { AdvancedDetailsButton } from './advanced-details-button';

export const WalletInitiatedHeader = () => {
  const t = useI18nContext();
  const { onCancel } = useConfirmActions();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const navigate = useNavigate();

  const handleBackButtonClick = useCallback(() => {
    if (
      currentConfirmation.type === TransactionType.shieldSubscriptionApprove
    ) {
      onCancel({ location: MetaMetricsEventLocation.Confirmation });
      navigate(SHIELD_PLAN_ROUTE);
      return;
    }

    const isNativeSend =
      currentConfirmation.type === TransactionType.simpleSend;
    const isERC20TokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransfer;
    const isNFTTokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransferFrom ||
      currentConfirmation.type === TransactionType.tokenMethodSafeTransferFrom;

    if (isNativeSend || isERC20TokenSend || isNFTTokenSend) {
      onCancel({
        location: MetaMetricsEventLocation.Confirmation,
        navigateBackForSend: true,
      });
    }
  }, [currentConfirmation, navigate, onCancel]);

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      paddingInline={3}
      paddingTop={4}
      paddingBottom={4}
      style={{ zIndex: 2 }}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleBackButtonClick}
        data-testid="wallet-initiated-header-back-button"
        color={IconColor.iconDefault}
      />
      <Text variant={TextVariant.headingSm} color={TextColor.inherit}>
        {currentConfirmation.type === TransactionType.shieldSubscriptionApprove
          ? t('shieldConfirmMembership')
          : t('review')}
      </Text>
      <AdvancedDetailsButton />
    </Box>
  );
};
