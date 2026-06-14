import React from 'react';
import { useSelector } from 'react-redux';

import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';
import { useConfirmationId } from '../../../../../hooks/useConfirmationId';

export function UniversalTransactionFeeRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();
  const confirmationId = useConfirmationId();
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!data?.formattedFee || !data.feeAssetSymbol) {
    return null;
  }

  const collapsedFee = data.formattedFeeFiat ?? data.formattedFee;

  const amountWithIcon = (amountText: string) => (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.flexEnd}
      gap={1}
    >
      <Text color={TextColor.textDefault}>{amountText}</Text>
      <AvatarToken
        name={data.feeAssetSymbol}
        src={data.feeAssetImageUrl}
        size={AvatarTokenSize.Xs}
      />
      <Text color={TextColor.textDefault}>{data.feeAssetSymbol}</Text>
    </Box>
  );

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.EstimatedFee}
      ownerId={confirmationId ?? data.approvalId}
      label={t('networkFee')}
    >
      {showAdvancedDetails ? (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexEnd}
        >
          {amountWithIcon(data.formattedFee)}
          {data.formattedFeeFiat ? (
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
              textAlign={TextAlign.Right}
            >
              {data.formattedFeeFiat}
            </Text>
          ) : null}
        </Box>
      ) : (
        amountWithIcon(collapsedFee)
      )}
    </ConfirmInfoAlertRow>
  );
}
