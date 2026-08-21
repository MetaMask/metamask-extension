import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { getConfirmationTransactionType } from '../../../utils/confirm';
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
import { SEND_TRANSACTION_TYPES } from '../../../constants/send';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { AdvancedDetailsButton } from './advanced-details-button';

export const WalletInitiatedHeader = () => {
  const t = useI18nContext();
  const { onCancel } = useConfirmActions();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const navigate = useNavigate();

  const confirmationType = getConfirmationTransactionType(currentConfirmation);

  const isSendTransaction =
    confirmationType && SEND_TRANSACTION_TYPES.includes(confirmationType);

  const handleBackButtonClick = useCallback(() => {
    if (confirmationType === TransactionType.shieldSubscriptionApprove) {
      onCancel({ location: MetaMetricsEventLocation.Confirmation });
      navigate(SHIELD_PLAN_ROUTE);
      return;
    }

    if (
      confirmationType === TransactionType.moneyAccountDeposit ||
      confirmationType === TransactionType.moneyAccountWithdraw ||
      confirmationType === TransactionType.musdClaim ||
      confirmationType === TransactionType.perpsDeposit ||
      confirmationType === TransactionType.perpsWithdraw
    ) {
      onCancel({
        location: MetaMetricsEventLocation.Confirmation,
        navigateBackToPreviousPage: true,
      });
      return;
    }

    const isNativeSend = confirmationType === TransactionType.simpleSend;
    const isERC20TokenSend =
      confirmationType === TransactionType.tokenMethodTransfer;
    const isNFTTokenSend =
      confirmationType === TransactionType.tokenMethodTransferFrom ||
      confirmationType === TransactionType.tokenMethodSafeTransferFrom;

    if (isNativeSend || isERC20TokenSend || isNFTTokenSend) {
      onCancel({
        location: MetaMetricsEventLocation.Confirmation,
        navigateBackForSend: true,
      });
    }
  }, [confirmationType, navigate, onCancel]);

  const getHeaderTitle = () => {
    if (isSendTransaction) {
      return null;
    }
    if (confirmationType === TransactionType.shieldSubscriptionApprove) {
      return t('shieldConfirmMembership');
    }
    if (confirmationType === TransactionType.moneyAccountDeposit) {
      return t('addFunds');
    }
    if (confirmationType === TransactionType.moneyAccountWithdraw) {
      return t('send');
    }
    if (confirmationType === TransactionType.musdClaim) {
      return null;
    }
    if (confirmationType === TransactionType.perpsDeposit) {
      return t('perpsDepositFundsTitle');
    }
    if (confirmationType === TransactionType.perpsWithdraw) {
      return t('perpsWithdrawFundsTitle');
    }
    return t('review');
  };

  const headerTitle = getHeaderTitle();

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
        onClick={handleBackButtonClick}
        data-testid="wallet-initiated-header-back-button"
        color={IconColor.iconDefault}
      />
      {headerTitle && (
        <Text variant={TextVariant.headingSm} color={TextColor.inherit}>
          {headerTitle}
        </Text>
      )}
      <AdvancedDetailsButton />
    </Box>
  );
};
