import { getMockTypedSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { orderSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { updateEventFragment } from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import { useSignatureEventFragment } from './useSignatureEventFragment';

const renderUseSignatureEventFragment = (signature: SignatureRequestType) => {
  const mockState = getMockTypedSignConfirmStateForRequest(signature);

  return renderHookWithConfirmContextProvider(() => useSignatureEventFragment(), mockState);
};

jest.mock('../../../store/actions', () => ({
  updateEventFragment: jest.fn(),
}));

describe('useSignatureEventFragment', () => {
  afterEach(jest.clearAllMocks);

  describe('updateSignatureEventFragment', () => {
    it('should call updateEventFragment to update the signature event fragment', () => {
      const mockUpdateProps = {
        event_name1: 'test_event 1',
        event_name2: 'test_event 2',
      };
      const expectedFragmentId = generateSignatureUniqueId(orderSignatureMsg.msgParams.requestId);

      const { result } = renderUseSignatureEventFragment(orderSignatureMsg);
      const { updateSignatureEventFragment } = result.current;

      updateSignatureEventFragment(mockUpdateProps);

      expect(updateEventFragment).toHaveBeenCalledWith(expectedFragmentId, mockUpdateProps);
    });

    it('should not call updateEventFragment if no signature requestId was found', () => {
      const mockSignatureWithoutRequestId = {
        ...orderSignatureMsg,
        msgParams: {
          data: '{"types":{"Order":[{"type":"uint8","name":"direction"},{"type":"address","name":"maker"},{"type":"address","name":"taker"},{"type":"uint256","name":"expiry"},{"type":"uint256","name":"nonce"},{"type":"address","name":"erc20Token"},{"type":"uint256","name":"erc20TokenAmount"},{"type":"Fee[]","name":"fees"},{"type":"address","name":"erc721Token"},{"type":"uint256","name":"erc721TokenId"},{"type":"Property[]","name":"erc721TokenProperties"}],"Fee":[{"type":"address","name":"recipient"},{"type":"uint256","name":"amount"},{"type":"bytes","name":"feeData"}],"Property":[{"type":"address","name":"propertyValidator"},{"type":"bytes","name":"propertyData"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"ZeroEx","version":"1.0.0","chainId":"0x1","verifyingContract":"0xdef1c0ded9bec7f1a1670819833240f027b25eff"},"primaryType":"Order","message":{"direction":"0","maker":"0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc","taker":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","expiry":"2524604400","nonce":"100131415900000000000000000000000000000083840314483690155566137712510085002484","erc20Token":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","erc20TokenAmount":"42000000000000","fees":[],"erc721Token":"0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e","erc721TokenId":"2516","erc721TokenProperties":[]}}',
          from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
          version: 'V4',
          signatureMethod: 'eth_signTypedData_v4',
          origin: '`https:///example.com`',
        },
      };
      const { result } = renderUseSignatureEventFragment(mockSignatureWithoutRequestId);
      const { updateSignatureEventFragment } = result.current;

      updateSignatureEventFragment();

      expect(updateEventFragment).not.toHaveBeenCalled();
    });
  });
});