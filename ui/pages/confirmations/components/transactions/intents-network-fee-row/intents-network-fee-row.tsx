import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { useIntentsContext } from '../../../context/intents/intents';
import { useIntentsQuote } from '../../../hooks/transactions/useIntentsQuote';

export function IntentsNetworkFeeRow() {
  const { sourceToken } = useIntentsContext();
  const { loading, networkFee } = useIntentsQuote();

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
      <ConfirmInfoRowText text={`${networkFeeFiat} ${networkFee}`} />
    </ConfirmInfoRow>
  );
}
