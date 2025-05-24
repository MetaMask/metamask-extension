import {
  DecodingData,
  DecodingDataChangeType,
} from '@metamask/signature-controller';

import { getMockTypedSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import * as SignatureEventFragment from './useSignatureEventFragment';
import { useDecodedSignatureMetrics } from './useDecodedSignatureMetrics';

const decodingData: DecodingData = {
  stateChanges: [
    {
      assetType: 'ERC20',
      changeType: DecodingDataChangeType.Approve,
      address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      amount: '1461501637330902918203684832716283019655932542975',
      contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    },
  ],
};

describe('useDecodedSignatureMetrics', () => {
  /**
   * Use fake timer since the tests test the decoding_latency value which is flaky.
   * Without the fake timer, the value may show as 0 or 0.001.
   */
  beforeAll(() => {
    jest.useFakeTimers({ now: 10 });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should not call updateSignatureEventFragment if supportedByDecodingAPI is false', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
    });

    const mockUpdateSignatureEventFragment = jest.fn();
    jest
      .spyOn(SignatureEventFragment, 'useSignatureEventFragment')
      .mockImplementation(() => ({
        updateSignatureEventFragment: mockUpdateSignatureEventFragment,
      }));

    renderHookWithConfirmContextProvider(
      () => useDecodedSignatureMetrics(false),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(0);
  });

  it('calls updateSignatureEventFragment with "decoding_in_progress" if decoding is loading ', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: true,
    });

    const mockUpdateSignatureEventFragment = jest.fn();
    jest
      .spyOn(SignatureEventFragment, 'useSignatureEventFragment')
      .mockImplementation(() => ({
        updateSignatureEventFragment: mockUpdateSignatureEventFragment,
      }));

    renderHookWithConfirmContextProvider(
      () => useDecodedSignatureMetrics(true),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(1);
    expect(mockUpdateSignatureEventFragment).toHaveBeenLastCalledWith({
      properties: {
        decoding_response: 'decoding_in_progress',
      },
    });
  });

  it('should call updateSignatureEventFragment with correct parameters if there are no state changes', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
    });

    const mockUpdateSignatureEventFragment = jest.fn();
    jest
      .spyOn(SignatureEventFragment, 'useSignatureEventFragment')
      .mockImplementation(() => ({
        updateSignatureEventFragment: mockUpdateSignatureEventFragment,
      }));

    renderHookWithConfirmContextProvider(
      () => useDecodedSignatureMetrics(true),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(1);
    expect(mockUpdateSignatureEventFragment).toHaveBeenLastCalledWith({
      properties: {
        decoding_change_types: [],
        decoding_response: 'NO_CHANGE',
        decoding_description: null,
        decoding_latency: 0,
      },
    });
  });

  it('should call updateSignatureEventFragment with correct parameters if there are state changes', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData,
    });

    const mockUpdateSignatureEventFragment = jest.fn();
    jest
      .spyOn(SignatureEventFragment, 'useSignatureEventFragment')
      .mockImplementation(() => ({
        updateSignatureEventFragment: mockUpdateSignatureEventFragment,
      }));

    renderHookWithConfirmContextProvider(
      () => useDecodedSignatureMetrics(true),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(1);
    expect(mockUpdateSignatureEventFragment).toHaveBeenLastCalledWith({
      properties: {
        decoding_change_types: ['APPROVE'],
        decoding_response: 'CHANGE',
        decoding_description: null,
        decoding_latency: 0,
      },
    });
  });

  it('should call updateSignatureEventFragment with correct parameters if response has error', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: [],
        error: {
          type: 'SOME_ERROR',
          message: 'some message',
        },
      },
    });

    const mockUpdateSignatureEventFragment = jest.fn();
    jest
      .spyOn(SignatureEventFragment, 'useSignatureEventFragment')
      .mockImplementation(() => ({
        updateSignatureEventFragment: mockUpdateSignatureEventFragment,
      }));

    renderHookWithConfirmContextProvider(
      () => useDecodedSignatureMetrics(true),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(1);
    expect(mockUpdateSignatureEventFragment).toHaveBeenLastCalledWith({
      properties: {
        decoding_change_types: [],
        decoding_response: 'SOME_ERROR',
        decoding_description: 'some message',
        decoding_latency: 0,
      },
    });
  });
});
