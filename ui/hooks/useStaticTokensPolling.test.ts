import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  staticAssetsStartPolling,
  staticAssetsStopPollingByPollingToken,
} from '../store/actions';
import useStaticTokensPolling from './useStaticTokensPolling';

const mockUseMultiPolling = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector) => mockUseSelector(selector)),
}));

jest.mock('./useMultiPolling', () => ({
  default: jest.fn((...args) => mockUseMultiPolling(...args)),
}));

jest.mock('../store/actions', () => ({
  staticAssetsStartPolling: jest.fn(),
  staticAssetsStopPollingByPollingToken: jest.fn(),
}));

describe('useStaticTokensPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMultiPolling.mockClear();
  });

  it('should call useMultiPolling with correct arguments when chain IDs and account are available', () => {
    mockUseSelector
      .mockReturnValueOnce(['0x1', '0x89']) // getEnabledChainIds
      .mockReturnValueOnce({ address: '0x123' }); // getSelectedAccount

    const state = {
      metamask: {},
    };

    renderHookWithProvider(() => useStaticTokensPolling(), state);

    expect(mockUseMultiPolling).toHaveBeenCalledTimes(1);
    expect(mockUseMultiPolling).toHaveBeenCalledWith({
      startPolling: staticAssetsStartPolling,
      stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
      input: [
        {
          chainIds: ['0x1', '0x89'],
          selectedAccountAddress: '0x123',
        },
      ],
    });
  });

  it('should call useMultiPolling with empty chainIds array when no chains are enabled', () => {
    mockUseSelector
      .mockReturnValueOnce([]) // getEnabledChainIds
      .mockReturnValueOnce({ address: '0x123' }); // getSelectedAccount

    const state = {
      metamask: {},
    };

    renderHookWithProvider(() => useStaticTokensPolling(), state);

    expect(mockUseMultiPolling).toHaveBeenCalledTimes(1);
    expect(mockUseMultiPolling).toHaveBeenCalledWith({
      startPolling: staticAssetsStartPolling,
      stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
      input: [
        {
          chainIds: [],
          selectedAccountAddress: '0x123',
        },
      ],
    });
  });

  it('should call useMultiPolling with empty account address when no account is selected', () => {
    mockUseSelector
      .mockReturnValueOnce(['0x1']) // getEnabledChainIds
      .mockReturnValueOnce(undefined); // getSelectedAccount

    const state = {
      metamask: {},
    };

    renderHookWithProvider(() => useStaticTokensPolling(), state);

    expect(mockUseMultiPolling).toHaveBeenCalledTimes(1);
    expect(mockUseMultiPolling).toHaveBeenCalledWith({
      startPolling: staticAssetsStartPolling,
      stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
      input: [
        {
          chainIds: ['0x1'],
          selectedAccountAddress: '',
        },
      ],
    });
  });

  it('should call useMultiPolling with empty chainIds when enabledChainIds is null', () => {
    mockUseSelector
      .mockReturnValueOnce(null) // getEnabledChainIds
      .mockReturnValueOnce({ address: '0x123' }); // getSelectedAccount

    const state = {
      metamask: {},
    };

    renderHookWithProvider(() => useStaticTokensPolling(), state);

    expect(mockUseMultiPolling).toHaveBeenCalledTimes(1);
    expect(mockUseMultiPolling).toHaveBeenCalledWith({
      startPolling: staticAssetsStartPolling,
      stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
      input: [
        {
          chainIds: [],
          selectedAccountAddress: '0x123',
        },
      ],
    });
  });
});
