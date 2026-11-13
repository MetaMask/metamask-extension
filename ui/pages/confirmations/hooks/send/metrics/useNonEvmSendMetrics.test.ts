/* eslint-disable @typescript-eslint/naming-convention */
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  classifyNonEvmSendError,
  isNonEvmSendUserRejection,
  NonEvmSendErrorCode,
  NonEvmSendFailurePhase,
  NonEvmSendUnknownValue,
  useNonEvmSendMetrics,
} from './useNonEvmSendMetrics';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const CHAIN_ID_CAIP = 'bip122:000000000019d6689c085ae165831e93';
const SNAP_ID = 'npm:@metamask/bitcoin-wallet-snap';

const renderMetrics = () =>
  renderHookWithProvider(() => useNonEvmSendMetrics(), mockState).result
    .current;

beforeEach(() => {
  mockTrackEvent.mockClear();
});

describe('useNonEvmSendMetrics', () => {
  describe('captureSendFailed', () => {
    it('tracks Send Failed with the failure axes', () => {
      renderMetrics().captureSendFailed({
        chainIdCaip: CHAIN_ID_CAIP,
        snapId: SNAP_ID,
        failurePhase: NonEvmSendFailurePhase.Validation,
        errorCode: 'InsufficientBalanceToCoverFee',
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      const event = mockTrackEvent.mock.calls[0][0];
      expect(event.name).toBe('Send Failed');
      expect(event.properties).toMatchObject({
        chain_id_caip: CHAIN_ID_CAIP,
        snap_id: SNAP_ID,
        client: 'extension',
        failure_phase: 'validation',
        error_code: 'InsufficientBalanceToCoverFee',
      });
    });

    it('records an unknown sentinel instead of undefined for a missing snap id', () => {
      renderMetrics().captureSendFailed({
        chainIdCaip: CHAIN_ID_CAIP,
        snapId: undefined,
        failurePhase: NonEvmSendFailurePhase.Validation,
        errorCode: 'InsufficientBalance',
      });

      const { properties } = mockTrackEvent.mock.calls[0][0];
      expect(properties.snap_id).toBe(NonEvmSendUnknownValue);
      expect(properties).not.toHaveProperty('snap_id', undefined);
      expect(properties.chain_id_caip).toBe(CHAIN_ID_CAIP);
    });

    it('records an unknown sentinel for a missing chain id', () => {
      renderMetrics().captureSendFailed({
        chainIdCaip: undefined,
        snapId: SNAP_ID,
        failurePhase: NonEvmSendFailurePhase.SnapRpc,
        errorCode: '-32603',
      });

      const { properties } = mockTrackEvent.mock.calls[0][0];
      expect(properties.chain_id_caip).toBe(NonEvmSendUnknownValue);
      expect(properties).not.toHaveProperty('chain_id_caip', undefined);
      expect(properties.snap_id).toBe(SNAP_ID);
    });
  });
});

describe('isNonEvmSendUserRejection', () => {
  it('returns true for JSON-RPC 4001', () => {
    expect(isNonEvmSendUserRejection({ code: 4001 })).toBe(true);
  });

  it('returns false for other codes', () => {
    expect(isNonEvmSendUserRejection({ code: -32000 })).toBe(false);
  });

  it('returns false for errors without a code', () => {
    expect(isNonEvmSendUserRejection(new Error('boom'))).toBe(false);
  });
});

describe('classifyNonEvmSendError', () => {
  it('classifies user rejection distinctly so it can be excluded from the failure rate', () => {
    expect(classifyNonEvmSendError({ code: 4001 })).toStrictEqual({
      errorCode: NonEvmSendErrorCode.UserRejected,
      failurePhase: NonEvmSendFailurePhase.Confirmation,
    });
  });

  it('classifies a thrown snap error as an rpc failure', () => {
    expect(classifyNonEvmSendError({ code: -32603 })).toStrictEqual({
      errorCode: '-32603',
      failurePhase: NonEvmSendFailurePhase.SnapRpc,
    });
  });

  it('classifies a codeless error as unknown', () => {
    expect(classifyNonEvmSendError(new Error('boom'))).toStrictEqual({
      errorCode: 'unknown',
      failurePhase: NonEvmSendFailurePhase.SnapRpc,
    });
  });
});
