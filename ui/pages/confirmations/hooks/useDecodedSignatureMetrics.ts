import { DecodingDataStateChange } from '@metamask/signature-controller';
import { useEffect } from 'react';

import { SignatureRequestType } from '../types/confirm';
import { useConfirmContext } from '../context/confirm';
import { useLoadingTime } from '../components/simulation-details/useLoadingTime';
import { useSignatureEventFragment } from './useSignatureEventFragment';

enum DecodingResponseType {
  Change = 'CHANGE',
  NoChange = 'NO_CHANGE',
}

export function useDecodedSignatureMetrics(supportedByDecodingAPI: boolean) {
  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const { loadingTime, setLoadingComplete } = useLoadingTime();
  const { decodingLoading, decodingData } = currentConfirmation;

  if (decodingLoading === false) {
    setLoadingComplete();
  }

  const decodingChangeTypes = (decodingData?.stateChanges ?? []).map(
    (change: DecodingDataStateChange) => change.changeType,
  );

  const decodingResponse =
    decodingData?.error?.type ??
    (decodingChangeTypes.length
      ? DecodingResponseType.Change
      : DecodingResponseType.NoChange);

  useEffect(() => {
    if (decodingLoading || !supportedByDecodingAPI) {
      return;
    }

    updateSignatureEventFragment({
      properties: {
        decoding_change_types: decodingChangeTypes,
        decoding_description: decodingData?.error?.message ?? null,
        decoding_latency: loadingTime ?? null,
        decoding_response: decodingLoading
          ? 'decoding_in_progress'
          : decodingResponse,
      },
    });
  }, [
    decodingResponse,
    decodingLoading,
    decodingChangeTypes,
    loadingTime,
    updateSignatureEventFragment,
  ]);
}
