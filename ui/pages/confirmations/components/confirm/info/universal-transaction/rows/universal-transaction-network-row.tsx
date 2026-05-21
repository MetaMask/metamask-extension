import React from 'react';

import { SOLANA_TOKEN_IMAGE_URL } from '../../../../../../../../shared/constants/multichain/networks';
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

const NETWORK_LABEL_BY_NAMESPACE: Record<string, string> = {
  solana: 'Solana',
};

const NETWORK_IMAGE_BY_NAMESPACE: Record<string, string> = {
  solana: SOLANA_TOKEN_IMAGE_URL,
};

export function UniversalTransactionNetworkRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  const networkLabel =
    NETWORK_LABEL_BY_NAMESPACE[data.chainNamespace] ?? data.chain;
  const networkImageUrl = NETWORK_IMAGE_BY_NAMESPACE[data.chainNamespace] ?? '';

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
          src={networkImageUrl}
          name={networkLabel}
          style={{ borderWidth: 0 }}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {networkLabel}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );
}
