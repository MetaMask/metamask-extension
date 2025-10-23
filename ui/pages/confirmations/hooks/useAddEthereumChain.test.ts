import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import * as actions from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useAddEthereumChain } from './useAddEthereumChain';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

jest.mock('../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  resolvePendingApproval: jest.fn(),
  addNetwork: jest.fn(),
  setNewNetworkAdded: jest.fn(),
}));

const mockConfirmation = {
  id: '1',
  type: ApprovalType.AddEthereumChain,
  origin: 'https://test-dapp.metamask.io',
  requestData: {
    chainId: '0x9999',
    chainName: 'Test Chain',
    rpcUrl: 'https://rpcurl.test.chain',
    ticker: 'TST',
    rpcPrefs: {
      blockExplorerUrl: 'https://blockexplorer.test.chain',
    },
  },
};

describe('useAddEthereumChain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockImplementation((action) =>
      typeof action === 'function' ? action(mockDispatch) : action,
    );
    (useSelector as jest.Mock).mockReturnValue({});
  });

  it('returns onSubmit function', () => {
    (useConfirmContext as jest.Mock).mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    const { result } = renderHook(() => useAddEthereumChain());

    expect(result.current.onSubmit).toBeDefined();
    expect(typeof result.current.onSubmit).toBe('function');
  });

  it('calls resolvePendingApproval on submit', async () => {
    (actions.resolvePendingApproval as jest.Mock).mockReturnValue(
      Promise.resolve(),
    );
    (useConfirmContext as jest.Mock).mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    const { result } = renderHook(() => useAddEthereumChain());

    await result.current.onSubmit();

    expect(actions.resolvePendingApproval).toHaveBeenCalledWith(
      '1',
      mockConfirmation.requestData,
    );
  });
});
