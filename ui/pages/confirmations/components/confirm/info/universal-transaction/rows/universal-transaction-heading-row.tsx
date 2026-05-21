/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';

import { SOLANA_TOKEN_IMAGE_URL } from '../../../../../../../../shared/constants/multichain/networks';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';
import SendHeadingLayout from '../../shared/send-heading-layout/send-heading-layout';

const ASSET_IMAGE_BY_SYMBOL: Record<string, string> = {
  SOL: SOLANA_TOKEN_IMAGE_URL,
};

export function UniversalTransactionHeadingRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  const assetImageUrl = ASSET_IMAGE_BY_SYMBOL[data.assetSymbol];

  return (
    <>
      <Text
        variant={TextVariant.headingLg}
        paddingTop={4}
        paddingBottom={2}
        textAlign={TextAlign.Center}
      >
        {t('send')}
      </Text>
      <SendHeadingLayout
        image={
          <AvatarToken
            name={data.assetSymbol}
            src={assetImageUrl}
            size={AvatarTokenSize.Xl}
          />
        }
      >
        <Box paddingBottom={1}>
          <Text variant={TextVariant.headingLg} color={TextColor.inherit}>
            {`${data.formattedAmount} ${data.assetSymbol}`}
          </Text>
        </Box>
      </SendHeadingLayout>
    </>
  );
}
