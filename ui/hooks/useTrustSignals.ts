import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import {
  getAddressSecurityAlertResponse,
  getTokenScanCacheResult,
} from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { SecurityAlertResponse } from '../pages/confirmations/types/confirm';

export type UseTrustSignalRequest = {
  value: string;
  type: NameType;
  variation?: string;
  isIncomingToken?: boolean;
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
): TrustSignalResult {
  return useTrustSignals([{ value, type }])[0];
}

export function useTrustSignals(
  requests: UseTrustSignalRequest[],
): TrustSignalResult[] {
  return useSelector((state) =>
    requests.map(({ value, type, variation, isIncomingToken }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      // Check address security alerts
      const securityAlertResponse = getAddressSecurityAlertResponse(
        state,
        value,
      );

      // Only check token scanning cache for incoming tokens
      const tokenScanCacheResult =
        isIncomingToken && variation
          ? getTokenScanCacheResult(state, variation, value)
          : undefined;

      // Get trust states from both sources
      const addressTrustState = securityAlertResponse
        ? getTrustState(securityAlertResponse)
        : TrustSignalDisplayState.Unknown;

      const tokenTrustState = tokenScanCacheResult
        ? getTokenTrustState(tokenScanCacheResult)
        : TrustSignalDisplayState.Unknown;

      // Prioritize the most severe trust signal
      const finalTrustState = getMostSevereTrustState(
        addressTrustState,
        tokenTrustState,
      );
      const label = securityAlertResponse?.label || null;

      return {
        state: finalTrustState,
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

type TokenScanCacheResult = {
  data: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type?: string;
  };
  timestamp?: number;
};

function getTokenTrustState(
  cachedResult: TokenScanCacheResult | undefined,
): TrustSignalDisplayState {
  const resultType = cachedResult?.data?.result_type;

  if (!resultType) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (resultType.toLowerCase()) {
    case 'malicious':
      return TrustSignalDisplayState.Malicious;
    case 'warning':
    case 'suspicious':
      return TrustSignalDisplayState.Warning;
    case 'benign':
    case 'verified':
      return TrustSignalDisplayState.Verified;
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

function getMostSevereTrustState(
  state1: TrustSignalDisplayState,
  state2: TrustSignalDisplayState,
): TrustSignalDisplayState {
  // Priority order (most severe to least):
  // 1. Malicious
  // 2. Warning
  // 3. Loading
  // 4. Verified
  // 5. Unknown

  const severityOrder = {
    [TrustSignalDisplayState.Malicious]: 0,
    [TrustSignalDisplayState.Warning]: 1,
    [TrustSignalDisplayState.Loading]: 2,
    [TrustSignalDisplayState.Verified]: 3,
    [TrustSignalDisplayState.Petname]: 4,
    [TrustSignalDisplayState.Recognized]: 5,
    [TrustSignalDisplayState.Unknown]: 6,
  };

  const severity1 = severityOrder[state1] ?? 6;
  const severity2 = severityOrder[state2] ?? 6;

  return severity1 <= severity2 ? state1 : state2;
}
