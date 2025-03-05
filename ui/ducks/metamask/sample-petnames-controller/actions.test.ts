import { Hex } from '@metamask/utils';
import type { Dispatch } from 'redux';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { assignPetname, ASSIGN_PET_NAME_METHOD } from './actions';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
const mockForceUpdateMetamaskStateAction = jest.fn().mockResolvedValue({});

jest.mock('../../../store/actions', () => ({
  forceUpdateMetamaskState: (dispatch: Dispatch) =>
    mockForceUpdateMetamaskStateAction(dispatch),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

describe('sample-petnames-controller thunks', () => {
  const mockChainId = '0x1' as Hex;
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Hex;

  const createMockDispatch = (): jest.MockedFunction<MetaMaskReduxDispatch> =>
    jest.fn() as jest.MockedFunction<MetaMaskReduxDispatch>;

  const expectBackgroundRequest = (method: string, params: unknown[]) => {
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(method, params);
  };

  beforeEach(() => {
    mockSubmitRequestToBackground.mockClear();
    mockForceUpdateMetamaskStateAction.mockClear();
  });

  describe('assignPetname', () => {
    it('should submit a request to the background and update state', async () => {
      const mockDispatch = createMockDispatch();
      const name = 'NewPetName';

      const thunk = assignPetname(mockChainId, mockAddress1, name);
      await thunk(mockDispatch);

      expectBackgroundRequest(ASSIGN_PET_NAME_METHOD, [
        mockChainId,
        mockAddress1,
        name,
      ]);
      expect(mockForceUpdateMetamaskStateAction).toHaveBeenCalledWith(
        mockDispatch,
      );
    });

    it('should handle errors and not update state when request fails', async () => {
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('Background request failed'),
      );
      const mockDispatch = createMockDispatch();
      const name = 'ErrorName';

      await expect(
        assignPetname(mockChainId, mockAddress1, name)(mockDispatch),
      ).rejects.toThrow('Background request failed');

      expectBackgroundRequest(ASSIGN_PET_NAME_METHOD, [
        mockChainId,
        mockAddress1,
        name,
      ]);
      expect(mockForceUpdateMetamaskStateAction).not.toHaveBeenCalled();
    });
  });
});
