import { Hex } from '@metamask/utils';
import { assignPetname } from './sample-petnames-controller-thunks';
import { ASSIGN_PET_NAME_METHOD } from './sample-petnames-controller-thunks';
import type { Dispatch } from 'redux';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
const mockForceUpdateMetamaskStateAction = jest.fn().mockResolvedValue({});

jest.mock('../../../store/actions', () => ({
  forceUpdateMetamaskState: (dispatch: Dispatch) =>
    mockForceUpdateMetamaskStateAction(dispatch),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: any[]) =>
    mockSubmitRequestToBackground(...args),
}));

describe('sample-petnames-controller thunks', () => {
  const mockChainId = '0x1' as Hex;
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Hex;

  beforeEach(() => {
    mockSubmitRequestToBackground.mockClear();
    mockForceUpdateMetamaskStateAction.mockClear();
  });

  describe('thunks', () => {
    it('should submit a request to the background and update state', async () => {
      const mockDispatch = jest.fn();
      const name = 'NewPetName';

      const thunk = assignPetname(mockChainId, mockAddress1, name);
      await thunk(mockDispatch);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        ASSIGN_PET_NAME_METHOD,
        [mockChainId, mockAddress1, name],
      );
      expect(mockForceUpdateMetamaskStateAction).toHaveBeenCalledWith(
        mockDispatch,
      );
    });

    it('should handle errors in the thunk', async () => {
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('Background request failed'),
      );

      const mockDispatch = jest.fn();

      await expect(
        assignPetname(
          mockChainId,
          mockAddress1,
          'ErrorName',
        )(mockDispatch as any),
      ).rejects.toThrow('Background request failed');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        ASSIGN_PET_NAME_METHOD,
        [mockChainId, mockAddress1, 'ErrorName'],
      );
      expect(mockForceUpdateMetamaskStateAction).not.toHaveBeenCalled();
    });
  });
});
