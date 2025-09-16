import React from 'react';
import { ConfirmInfoAlertRow } from '../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Text,
  IconName,
} from '../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetPill } from './asset-pill';
import { AmountPill } from './amount-pill';
import { BalanceChange } from './types';
import { IndividualFiatDisplay } from './fiat-display';
import { BalanceChangeRow } from './balance-change-row';

export const AlertBalanceChangeRow: React.FC<{
  label?: string;
  showFiat?: boolean;
  balanceChange: BalanceChange;
  labelColor?: TextColor;
  transactionId: string;
}> = ({ label, showFiat, balanceChange, labelColor, transactionId }) => {
  const t = useI18nContext();

  if (!label) {
    // If there's no label, just render the regular row
    return (
      <BalanceChangeRow
        label={label}
        showFiat={showFiat}
        balanceChange={balanceChange}
        labelColor={labelColor}
      />
    );
  }

  const {
    asset,
    amount,
    fiatAmount,
    isApproval,
    isAllApproval,
    isUnlimitedApproval,
    onEdit,
  } = balanceChange;

  // For rows with labels (like "You receive"), wrap with alert support
  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.IncomingTokens}
      ownerId={transactionId}
      label={label}
      style={{ paddingLeft: 0, paddingRight: 0 }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={1}
        marginLeft={'auto'}
        style={{ minWidth: 0 }}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={1}>
          {onEdit && (
            <ButtonIcon
              data-testid="balance-change-edit"
              color={IconColor.primaryDefault}
              ariaLabel={t('edit')}
              iconName={IconName.Edit}
              onClick={onEdit}
              size={ButtonIconSize.Sm}
              // to reset the button padding
              style={{ marginRight: '-4px' }}
            />
          )}
          <AmountPill
            asset={asset}
            amount={amount}
            isApproval={isApproval}
            isAllApproval={isAllApproval}
            isUnlimitedApproval={isUnlimitedApproval}
          />
          <AssetPill asset={asset} />
        </Box>
        {showFiat && <IndividualFiatDisplay fiatAmount={fiatAmount} />}
      </Box>
    </ConfirmInfoAlertRow>
  );
};
