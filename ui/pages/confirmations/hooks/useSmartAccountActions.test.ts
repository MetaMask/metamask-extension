import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { rejectPendingApproval } from '../../../store/actions';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { upgradeAccountConfirmation } from '../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../types/confirm';
import { useSmartAccountActions } from './useSmartAccountActions';

jest.mock('../../../store/actions', () => ({
  rejectPendingApproval: jest.fn().mockReturnValue({}),
  setAccountDetailsAddress: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe('useSmartAccountActions', () => {
  afterEach(jest.clearAllMocks);

  describe('handleRejectUpgrade', () => {
    it('should reject current confirmation', async () => {
      const state = getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      );
      const { result } = renderHookWithConfirmContextProvider(
        () => useSmartAccountActions(),
        state,
      );
      result.current.handleRejectUpgrade();
      await flushPromises();
      expect(rejectPendingApproval).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledTimes(2);
    });
  });
});
