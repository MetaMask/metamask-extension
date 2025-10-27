'use no memo';
// TODO: Fix - Calling `useTrustSignals` from `useTrustSignal`, which is not a component, violates the rules of hooks.

import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
import {
  ResultType,
  createCacheKey,
  mapChainIdToSupportedEVMChain,
} from '../../shared/lib/trust-signals';
import { SecurityAlertResponse } from '../pages/confirmations/types/confirm';

export type UseTrustSignalRequest = {
  value: string;
  type: NameType;
  chainId?: string;
};

export enum TrustSignalDisplayState {
  Loading = 'loading',
  Malicious = 'malicious',
  Petname = 'petname',
  Verified = 'verified',
  Warning = 'warning',
  Recognized = 'recognized',
  Unknown = 'unknown',
}

export type TrustSignalResult = {
  state: TrustSignalDisplayState;
  label: string | null;
};

export function useTrustSignal(
  value: string,
  type: NameType,
  chainId?: string,
): TrustSignalResult {
  return useTrustSignals([{ value, type, chainId }])[0];
}

export function useTrustSignals(
  requests: UseTrustSignalRequest[],
): TrustSignalResult[] {
  return useSelector((state) =>
    requests.map(({ value, type, chainId }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      if (!chainId) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const supportedEVMChain = mapChainIdToSupportedEVMChain(chainId);
      if (!supportedEVMChain) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const cacheKey = createCacheKey(supportedEVMChain, value);

      const securityAlertResponse = getAddressSecurityAlertResponse(
        state,
        cacheKey,
      );

      if (!securityAlertResponse) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const label = securityAlertResponse.label || null;
      const trustState = getTrustState(securityAlertResponse);

      return {
        state: trustState,
        label,
      };
    }),
  );
}

function getTrustState(
  securityAlertResponse: SecurityAlertResponse,
): TrustSignalDisplayState {
  if (!securityAlertResponse.result_type) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (securityAlertResponse.result_type) {
    case ResultType.Loading:
      return TrustSignalDisplayState.Loading;
    case ResultType.Malicious:
      return TrustSignalDisplayState.Malicious;
    case ResultType.Warning:
      return TrustSignalDisplayState.Warning;
    case ResultType.Trusted:
      return TrustSignalDisplayState.Verified;
    case ResultType.Benign:
    case ResultType.ErrorResult:
    default:
      return TrustSignalDisplayState.Unknown;
  }
}
