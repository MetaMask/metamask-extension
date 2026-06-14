/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';

import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import SendHeadingLayout from '../../confirm/info/shared/send-heading-layout/send-heading-layout';
import { useUniversalTransactionDataOptional } from '../../../hooks/transactions/useUniversalTransactionData';

export function UniversalTransactionHeadingRow() {
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  return (
    <SendHeadingLayout
      image={
        <AvatarToken
          name={data.assetSymbol}
          src={data.assetImageUrl}
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
  );
}
