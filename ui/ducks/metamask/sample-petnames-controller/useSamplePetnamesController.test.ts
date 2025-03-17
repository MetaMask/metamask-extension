import { Hex } from '@metamask/utils';
import { useSelector, useDispatch } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { getPetNamesForCurrentChain } from './selectors';
import { assignPetname } from './actions';
import useSamplePetnamesController from './useSamplePetnamesController';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('./selectors', () => ({
  getPetNamesForCurrentChain: jest.fn(),
}));

jest.mock('./actions', () => ({
  assignPetname: jest.fn(),
}));

describe('useSamplePetnamesController', () => {
  const mockChainId = '0x1' as Hex;
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
  const mockPetNames = {
    [mockAddress]: 'TestName',
  };
  const mockDispatch = jest.fn();
  const mockAssignPetnameAction = { type: 'ASSIGN_PET_NAME' };

  /**
   * Helper function to render the hook and return the results
   */
  const renderTestHook = () => {
    return renderHook(() => useSamplePetnamesController());
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getPetNamesForCurrentChain) {
        return mockPetNames;
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

      expect(result.current.namesForCurrentChain).toEqual(mockPetNames);

      expect(useSelector).toHaveBeenCalledWith(getPetNamesForCurrentChain);
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
      const petName = 'NewPetName';

      result.current.assignPetname(mockAddress, petName);

      expect(assignPetname).toHaveBeenCalledWith(
        mockChainId,
        mockAddress,
        petName,
      );

      expect(mockDispatch).toHaveBeenCalledWith(mockAssignPetnameAction);
    });
  });
});
