import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../components/component-library';
import Tooltip from '../../../../../components/ui/tooltip';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { setConfirmationAdvancedDetailsOpen } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import { useDispatch } from '../../../../../store/hooks';

export const AdvancedDetailsButton = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const setShowAdvancedDetails = (value: boolean): void => {
    dispatch(setConfirmationAdvancedDetailsOpen(value));
  };

  const confirmationType = getConfirmationTransactionType(currentConfirmation);

  return (
    <Box
      backgroundColor={
        showAdvancedDetails
          ? BackgroundColor.infoMuted
          : BackgroundColor.transparent
      }
      borderRadius={BorderRadius.MD}
      // hiding through visibility instead of rendering conditionally so the
      // header layout is not affected
      style={
        confirmationType === TransactionType.shieldSubscriptionApprove ||
        confirmationType === TransactionType.moneyAccountDeposit ||
        confirmationType === TransactionType.moneyAccountWithdraw ||
        confirmationType === TransactionType.perpsDeposit ||
        confirmationType === TransactionType.perpsWithdraw
          ? { visibility: 'hidden' }
          : {}
      }
    >
      <Tooltip
        title={
          showAdvancedDetails
            ? t('hideAdvancedDetails')
            : t('showAdvancedDetails')
        }
      >
        <ButtonIcon
          ariaLabel="Advanced tx details"
          color={IconColor.iconDefault}
          iconName={IconName.Customize}
          data-testid="header-advanced-details-button"
          size={ButtonIconSize.Md}
          onClick={() => {
            setShowAdvancedDetails(!showAdvancedDetails);
          }}
        />
      </Tooltip>
    </Box>
  );
};
