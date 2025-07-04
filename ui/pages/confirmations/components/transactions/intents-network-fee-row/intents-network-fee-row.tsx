import React from 'react';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { useIntentsContext } from '../../../context/intents/intents';
import { useIntentsQuotes } from '../../../hooks/transactions/useIntentsQuotes';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../../components/component-library';
import { TokenPill } from '../../confirm/token-pill/token-pill';

export function IntentsNetworkFeeRow() {
  const { sourceToken } = useIntentsContext();
  const { loading, networkFee } = useIntentsQuotes();

  const sourceChainId = sourceToken?.chainId;

  const networkFeeFiat = useTokenFiatAmount(
    NATIVE_TOKEN_ADDRESS,
    networkFee,
    undefined,
    {},
    true,
    sourceChainId,
  );

  if (loading || !networkFee || !sourceChainId) {
    return null;
  }

  return (
    <ConfirmInfoRow label="Network Fee">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Text>{networkFeeFiat}</Text>
        <Text>{networkFee}</Text>
        <TokenPill
          chainId={sourceChainId}
          tokenAddress={NATIVE_TOKEN_ADDRESS}
        />
      </Box>
    </ConfirmInfoRow>
  );
}
