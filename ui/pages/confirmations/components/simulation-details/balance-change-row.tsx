import React from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Text,
  IconName,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ConfirmInfoAlertRow } from '../../../../components/app/confirm/info/row/alert-row/alert-row';
import { AssetPill } from './asset-pill';
import { AmountPill } from './amount-pill';
import { BalanceChange } from './types';
import { IndividualFiatDisplay } from './fiat-display';

/**
 * Displays a single balance change, including the asset, amount, and fiat value.
 *
 * @param props
 * @param props.label
 * @param props.showFiat
 * @param props.balanceChange
 * @param props.labelColor
 * @param props.alertKey
 * @param props.ownerId
 */
export const BalanceChangeRow: React.FC<{
  label?: string;
  showFiat?: boolean;
  balanceChange: BalanceChange;
  labelColor?: TextColor;
  alertKey?: string;
  ownerId?: string;
}> = ({ label, showFiat, balanceChange, labelColor, alertKey, ownerId }) => {
  const t = useI18nContext();

  const {
    asset,
    amount,
    fiatAmount,
    isApproval,
    isAllApproval,
    isUnlimitedApproval,
    onEdit,
  } = balanceChange;

  const content = (
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
  );

  // If we have a label and alert props, wrap with ConfirmInfoAlertRow
  if (label && alertKey && ownerId) {
    return (
      <ConfirmInfoAlertRow
        data-testid="simulation-details-balance-change-row"
        alertKey={alertKey}
        ownerId={ownerId}
        label={label}
        style={{ paddingLeft: 0, paddingRight: 0 }}
      >
        {content}
      </ConfirmInfoAlertRow>
    );
  }

  // Otherwise, render normally
  return (
    <Box
      data-testid="simulation-details-balance-change-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.flexStart}
      gap={1}
      flexWrap={FlexWrap.Wrap}
    >
      {label && (
        <Text
          style={{ whiteSpace: 'nowrap' }}
          color={labelColor}
          variant={TextVariant.bodyMd}
        >
          {label}
        </Text>
      )}
      {content}
    </Box>
  );
};
