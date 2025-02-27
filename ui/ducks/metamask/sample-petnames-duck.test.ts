import { Hex } from '@metamask/utils';
import {
  getSamplePetnamesByChainIdAndAddress,
  getPetNamesForCurrentChain,
  assignPetname,
  ASSIGN_PET_NAME_METHOD,
} from './sample-petnames-duck';
import type { Dispatch } from 'redux';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
const mockForceUpdateMetamaskStateAction = jest.fn().mockResolvedValue({});

jest.mock('../../store/actions', () => ({
  forceUpdateMetamaskState: (dispatch: Dispatch) =>
    mockForceUpdateMetamaskStateAction(dispatch),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: any[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: (state: any) => state.metamask.provider.chainId,
}));

describe('sample-petnames-duck', () => {
  const mockChainId = '0x1' as Hex;
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
  const mockAddress2 = '0xabcdef1234567890abcdef1234567890abcdef12' as Hex;

  const mockState = {
    metamask: {
      samplePetnamesByChainIdAndAddress: {
        [mockChainId]: {
          [mockAddress1]: 'TestName1',
          [mockAddress2]: 'TestName2',
        },
        '0x2': {
          [mockAddress1]: 'TestNameOnOtherChain',
        },
      },
      provider: {
        chainId: mockChainId,
      },
    },
  };

  beforeEach(() => {
    mockSubmitRequestToBackground.mockClear();
    mockForceUpdateMetamaskStateAction.mockClear();
  });

  describe('selectors (implementation details)', () => {
    it('should select the pet names by chain and address', () => {
      const result = getSamplePetnamesByChainIdAndAddress(mockState as any);
      expect(result).toEqual(
        mockState.metamask.samplePetnamesByChainIdAndAddress,
      );
    });

    it('should select pet names for the current chain', () => {
      const result = getPetNamesForCurrentChain(mockState as any);
      expect(result).toEqual({
        [mockAddress1]: 'TestName1',
        [mockAddress2]: 'TestName2',
      });
    });
  });

  describe('thunks (implementation details)', () => {
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
