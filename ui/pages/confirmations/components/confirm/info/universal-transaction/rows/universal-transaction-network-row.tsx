import React from 'react';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexWrap,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';

export function UniversalTransactionNetworkRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  return (
    <ConfirmInfoRow label={t('transactionFlowNetwork')}>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexWrap={FlexWrap.Wrap}
        gap={2}
        minWidth={BlockSize.Zero}
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          src={data.networkImageUrl}
          name={data.networkLabel}
          style={{ borderWidth: 0 }}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {data.networkLabel}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );
}
