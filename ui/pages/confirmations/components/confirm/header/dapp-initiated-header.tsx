import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
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
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../../../constants/send';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { AdvancedDetailsButton } from './advanced-details-button';

// MMPay dApp PoC: dApp-initiated (wallet_mmPay) perps confirmations use the
// single-action footer, which has no Cancel, so the header provides close.
const MMPAY_DAPP_TITLE_KEYS: Partial<Record<TransactionType, string>> = {
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
  const mmPayTitleKey = confirmationType
    ? MMPAY_DAPP_TITLE_KEYS[confirmationType]
    : undefined;

  const handleClose = async () => {
    await onCancel({ location: MetaMetricsEventLocation.Confirmation });
    if (currentConfirmation?.id) {
      navigateNext(currentConfirmation.id);
    }
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      paddingInline={3}
      paddingTop={4}
      paddingBottom={4}
      style={{
        zIndex: 2,
        position: 'relative',
        minHeight: isSendTransaction ? '64px' : 'auto',
      }}
    >
      {mmPayTitleKey && (
        <Box
          paddingLeft={3}
          style={{ marginRight: 'auto', position: 'absolute', left: 0 }}
        >
          <ButtonIcon
            iconName={IconName.Close}
            ariaLabel={t('close')}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="dapp-initiated-header-close-button"
            color={IconColor.iconDefault}
          />
        </Box>
      )}
      {!isSendTransaction && (
        <Text variant={TextVariant.headingSm} color={TextColor.inherit}>
          {mmPayTitleKey ? t(mmPayTitleKey) : t('transferRequest')}
        </Text>
      )}
      <Box
        paddingRight={3}
        style={{ marginLeft: 'auto', position: 'absolute', right: 0 }}
      >
        <AdvancedDetailsButton />
      </Box>
    </Box>
  );
};
