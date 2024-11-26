import { useEffect } from 'react';
import { DecodingDataStateChange } from '@metamask/signature-controller';

import { SignatureRequestType } from '../../types/confirm';
import { useConfirmContext } from '../../context/confirm';
import { useSignatureEventFragment } from '../../hooks/useSignatureEventFragment';

enum DecodingResponse {
  Change = 'CHANGE',
  NoChange = 'NO_CHANGE',
}

export function useDecodedSignatureMetrics() {
  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const { decodingLoading, decodingData } = currentConfirmation;

  const decodingChangeTypes = (decodingData?.stateChanges ?? []).map(
    (change: DecodingDataStateChange) => change.changeType,
  );

  const decodingResponse =
    decodingData?.error?.type ??
    (decodingChangeTypes.length
      ? DecodingResponse.Change
      : DecodingResponse.NoChange);

  useEffect(() => {
    if (decodingLoading || !process.env.ENABLE_SIGNATURE_DECODING) {
      return;
    }

    updateSignatureEventFragment({
      properties: {
        decoding_response: decodingResponse,
        decoding_change_types: decodingChangeTypes,
      },
    });
  }, [
    decodingResponse,
    decodingLoading,
    decodingChangeTypes,
    updateSignatureEventFragment,
  ]);
}
