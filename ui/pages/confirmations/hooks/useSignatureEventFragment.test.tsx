import { getMockTypedSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { orderSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { updateEventFragment } from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import { useSignatureEventFragment } from './useSignatureEventFragment';

const renderUseSignatureEventFragment = (signature: SignatureRequestType) => {
  const mockState = getMockTypedSignConfirmStateForRequest(signature);

  return renderHookWithConfirmContextProvider(
    () => useSignatureEventFragment(),
    mockState,
  );
};

jest.mock('../../../store/actions', () => ({
  updateEventFragment: jest.fn(),
}));

describe('useSignatureEventFragment', () => {
  afterEach(jest.clearAllMocks);

  describe('updateSignatureEventFragment', () => {
    it('should call updateEventFragment to update the signature event fragment', () => {
      const mockUpdateProps = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        event_name1: 'test_event 1',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        event_name2: 'test_event 2',
      };
      const expectedFragmentId = generateSignatureUniqueId(
        orderSignatureMsg.msgParams.requestId,
      );

      const { result } = renderUseSignatureEventFragment(orderSignatureMsg);
      const { updateSignatureEventFragment } = result.current;

      updateSignatureEventFragment(mockUpdateProps);

      expect(updateEventFragment).toHaveBeenCalledWith(
        expectedFragmentId,
        mockUpdateProps,
      );
    });

    it('should not call updateEventFragment if no signature requestId was found', () => {
      const mockSignatureWithoutRequestId = {
        ...orderSignatureMsg,
        msgParams: {
          data: orderSignatureMsg.msgParams.data,
          from: orderSignatureMsg.msgParams.from,
          version: orderSignatureMsg.msgParams.version,
          signatureMethod: orderSignatureMsg.msgParams.signatureMethod,
          origin: orderSignatureMsg.msgParams.origin,
        },
      };
      const { result } = renderUseSignatureEventFragment(
        mockSignatureWithoutRequestId,
      );
      const { updateSignatureEventFragment } = result.current;

      updateSignatureEventFragment();

      expect(updateEventFragment).not.toHaveBeenCalled();
    });
  });
});
