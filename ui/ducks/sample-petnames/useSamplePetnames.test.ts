import { Hex } from '@metamask/utils';
import { useSelector, useDispatch } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { getPetnamesForCurrentChain } from './selectors';
import { assignPetname } from './actions';
import useSamplePetnames from './useSamplePetnames';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('./selectors', () => ({
  getPetnamesForCurrentChain: jest.fn(),
}));

jest.mock('./actions', () => ({
  assignPetname: jest.fn(),
}));

describe('useSamplePetnames', () => {
  const mockChainId = '0x1' as Hex;
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
  const mockPetnames = {
    [mockAddress]: 'TestName',
  };
  const mockDispatch = jest.fn();
  const mockAssignPetnameAction = { type: 'ASSIGN_PET_NAME' };

  /**
   * Helper function to render the hook and return the results
   */
  const renderTestHook = () => {
    return renderHook(() => useSamplePetnames());
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getPetnamesForCurrentChain) {
        return mockPetnames;
      }
      if (selector === getCurrentChainId) {
        return mockChainId;
      }
      return undefined;
    });

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (assignPetname as jest.Mock).mockReturnValue(mockAssignPetnameAction);
  });

  describe('namesForCurrentChain', () => {
    it('should return pet names for the current chain from the selector', () => {
      const { result } = renderTestHook();

      expect(result.current.namesForCurrentChain).toEqual(mockPetnames);

      expect(useSelector).toHaveBeenCalledWith(getPetnamesForCurrentChain);
    });
  });

  describe('chainId', () => {
    it('should retrieve the current chain ID from the selector', () => {
      renderTestHook();

      expect(useSelector).toHaveBeenCalledWith(getCurrentChainId);
    });
  });

  describe('assignPetname', () => {
    it('should create a function that dispatches the correct action with the right parameters', () => {
      const { result } = renderTestHook();
      const petname = 'NewPetname';

      result.current.assignPetname(mockAddress, petname);

      expect(assignPetname).toHaveBeenCalledWith(
        mockChainId,
        mockAddress,
        petname,
      );

      expect(mockDispatch).toHaveBeenCalledWith(mockAssignPetnameAction);
    });
  });
});
