import { DecodingDataStateChange } from '@metamask/signature-controller';
import { useEffect, useMemo } from 'react';

import { SignatureRequestType } from '../types/confirm';
import { useConfirmContext } from '../context/confirm';
import { useLoadingTime } from '../components/simulation-details/useLoadingTime';
import { useSignatureEventFragment } from './useSignatureEventFragment';

enum DecodingResponseType {
  Change = 'CHANGE',
  NoChange = 'NO_CHANGE',
  InProgress = 'decoding_in_progress',
}

export function useDecodedSignatureMetrics(supportedByDecodingAPI: boolean) {
  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const { loadingTime, setLoadingComplete } = useLoadingTime();
  const { decodingLoading, decodingData } = currentConfirmation;

  if (decodingLoading === false) {
    setLoadingComplete();
  }

  const decodingChangeTypes = useMemo(
    () =>
      (decodingData?.stateChanges ?? []).map(
        (change: DecodingDataStateChange) => change.changeType,
      ),
    [decodingData],
  );

  const decodingResponse =
    decodingData?.error?.type ??
    (decodingChangeTypes.length
      ? DecodingResponseType.Change
      : DecodingResponseType.NoChange);

  useEffect(() => {
    if (!supportedByDecodingAPI) {
      return;
    }
    if (decodingLoading) {
      updateSignatureEventFragment({
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          decoding_response: DecodingResponseType.InProgress,
        },
      });

      return;
    }

    updateSignatureEventFragment({
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        decoding_change_types: decodingChangeTypes,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        decoding_description: decodingData?.error?.message ?? null,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        decoding_latency: loadingTime ?? null,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        decoding_response: decodingResponse,
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
