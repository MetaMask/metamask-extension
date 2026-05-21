import React from 'react';
import { useSelector } from 'react-redux';

import { SOLANA_TOKEN_IMAGE_URL } from '../../../../../../../../shared/constants/multichain/networks';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
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

const FEE_ASSET_IMAGE_BY_SYMBOL: Record<string, string> = {
  SOL: SOLANA_TOKEN_IMAGE_URL,
};

export function UniversalTransactionFeeRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!data) {
    return null;
  }

  const feeAssetSymbol = 'SOL';
  const feeImageUrl = FEE_ASSET_IMAGE_BY_SYMBOL[feeAssetSymbol];
  const feeFiat = '< $0.01';
  const feeNative = '0.000005';

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
        name={feeAssetSymbol}
        src={feeImageUrl}
        size={AvatarTokenSize.Xs}
      />
      <Text color={TextColor.textDefault}>{feeAssetSymbol}</Text>
    </Box>
  );

  return (
    <ConfirmInfoRow label={t('networkFee')}>
      {showAdvancedDetails ? (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexEnd}
        >
          {amountWithIcon(feeNative)}
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            textAlign={TextAlign.Right}
          >
            {feeFiat}
          </Text>
        </Box>
      ) : (
        amountWithIcon(feeFiat)
      )}
    </ConfirmInfoRow>
  );
}
