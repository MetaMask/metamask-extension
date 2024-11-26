import { getMockTypedSignConfirmStateForRequest } from '../../../../../test/data/confirmations/helper';
import { permitSignatureMsg } from '../../../../../test/data/confirmations/typed_sign';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import * as SignatureEventFragment from '../../hooks/useSignatureEventFragment';
import { useDecodedSignatureMetrics } from './useDecodedSignatureMetrics';

describe('useDecodedSignatureMetrics', () => {
  process.env.ENABLE_SIGNATURE_DECODING = 'true';
  it('should not call updateSignatureEventFragment if decodingLoading is true', async () => {
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
      () => useDecodedSignatureMetrics(),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(0);
  });

  it('should call updateSignatureEventFragment with correct parameters', async () => {
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
      () => useDecodedSignatureMetrics(),
      state,
    );

    expect(mockUpdateSignatureEventFragment).toHaveBeenCalledTimes(1);
    expect(mockUpdateSignatureEventFragment).toHaveBeenLastCalledWith({
      properties: {
        decoding_change_types: [],
        decoding_response: 'NO_CHANGE',
      },
    });
  });
});
