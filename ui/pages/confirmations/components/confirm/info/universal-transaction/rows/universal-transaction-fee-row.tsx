import React from 'react';

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
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';

const FEE_ASSET_IMAGE_BY_SYMBOL: Record<string, string> = {
  SOL: SOLANA_TOKEN_IMAGE_URL,
};

export function UniversalTransactionFeeRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data || !data.formattedFee || !data.feeAssetSymbol) {
    return null;
  }

  const feeImageUrl = FEE_ASSET_IMAGE_BY_SYMBOL[data.feeAssetSymbol];

  return (
    <ConfirmInfoRow label={t('networkFee')}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        gap={2}
        marginLeft={8}
      >
        {data.formattedFeeFiat && (
          <Text color={TextColor.textDefault}>{data.formattedFeeFiat}</Text>
        )}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <AvatarToken
            name={data.feeAssetSymbol}
            src={feeImageUrl}
            size={AvatarTokenSize.Xs}
          />
          <Text color={TextColor.textAlternative}>
            {`${data.formattedFee} ${data.feeAssetSymbol}`}
          </Text>
        </Box>
      </Box>
    </ConfirmInfoRow>
  );
}
