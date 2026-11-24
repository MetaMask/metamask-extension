import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../../../constants/send';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { AdvancedDetailsButton } from './advanced-details-button';

/**
 * dApp-initiated pay confirmations that use the single-action footer, which has no
 * Cancel button. They get their own title and a close button in the header so
 * the user can reject the request without closing the popup.
 */
const CLOSABLE_TITLE_KEYS: Partial<Record<TransactionType, string>> = {
  [TransactionType.perpsDeposit]: 'perpsDepositFundsTitle',
  [TransactionType.perpsWithdraw]: 'perpsWithdrawFundsTitle',
};

export const DAppInitiatedHeader = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { onCancel } = useConfirmActions();
  const { navigateNext } = useConfirmationNavigation();

  const isSendTransaction =
    currentConfirmation?.type &&
    SEND_TRANSACTION_TYPES.includes(currentConfirmation.type);

  const confirmationType = getConfirmationTransactionType(currentConfirmation);
  const closableTitleKey = confirmationType
    ? CLOSABLE_TITLE_KEYS[confirmationType]
    : undefined;

  const confirmationId = currentConfirmation?.id;

  const handleClose = useCallback(async () => {
    await onCancel({ location: MetaMetricsEventLocation.Confirmation });
    if (confirmationId) {
      navigateNext(confirmationId);
    }
  }, [confirmationId, navigateNext, onCancel]);

  if (closableTitleKey) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        paddingHorizontal={3}
        paddingVertical={4}
        className="z-[2]"
      >
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={handleClose}
          data-testid="dapp-initiated-header-close-button"
        />
        <Text
          variant={TextVariant.HeadingSm}
          color={TextColor.Inherit}
          data-testid="dapp-initiated-header-title"
        >
          {t(closableTitleKey)}
        </Text>
        <AdvancedDetailsButton />
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      paddingHorizontal={3}
      paddingVertical={4}
      className={`relative z-[2] ${isSendTransaction ? 'min-h-16' : ''}`}
    >
      {!isSendTransaction && (
        <Text
          variant={TextVariant.HeadingSm}
          color={TextColor.Inherit}
          data-testid="dapp-initiated-header-title"
        >
          {t('transferRequest')}
        </Text>
      )}
      <Box paddingRight={3} className="absolute right-0">
        <AdvancedDetailsButton />
      </Box>
    </Box>
  );
};
