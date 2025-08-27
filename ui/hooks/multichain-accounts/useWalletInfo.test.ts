import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { AccountWalletId } from '@metamask/account-api';
import { useHdKeyringsWithSnapAccounts } from '../multi-srp/useHdKeyringsWithSnapAccounts';
import { getIsPrimarySeedPhraseBackedUp } from '../../ducks/metamask/metamask';
import { useWalletInfo } from './useWalletInfo';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../multi-srp/useHdKeyringsWithSnapAccounts', () => ({
  useHdKeyringsWithSnapAccounts: jest.fn(),
}));

describe('useWalletInfo', () => {
  const mockWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as AccountWalletId;

  const mockRawMultichainAccounts = {
    '01JKAF3DSGM3AB87EM9N0K41AJ:default': {
      id: '01JKAF3DSGM3AB87EM9N0K41AJ:default',
      metadata: {
        name: 'Account 1',
      },
      accounts: ['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
    },
  };

  const mockHdKeyrings = [
    {
      metadata: {
        id: '01JKAF3DSGM3AB87EM9N0K41AJ',
        name: 'Wallet 1',
      },
      accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
    },
    {
      metadata: {
        id: '01JKAF3PJ247KAM6C03G5Q0NP8',
        name: 'Wallet 2',
      },
      accounts: ['0xeb9e64b93097bc15f01f13eae97015c57ab64823'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return multichainAccounts and undefined keyringId when no accounts found', () => {
    // Setup mocks for the empty accounts case
    (useSelector as jest.Mock).mockImplementation(() => ({}));
    (useHdKeyringsWithSnapAccounts as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useWalletInfo(mockWalletId));

    expect(result.current).toEqual({
      multichainAccounts: [],
      keyringId: undefined,
    });
  });

  it('should return multichainAccounts and keyringId when accounts found and keyring matched', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getIsPrimarySeedPhraseBackedUp) {
        return true;
      }

      if (typeof selector === 'function') {
        return mockRawMultichainAccounts;
      }

      return null;
    });

    (useHdKeyringsWithSnapAccounts as jest.Mock).mockReturnValue(
      mockHdKeyrings,
    );

    const { result } = renderHook(() => useWalletInfo(mockWalletId));

    expect(result.current).toEqual({
      multichainAccounts: [
        mockRawMultichainAccounts['01JKAF3DSGM3AB87EM9N0K41AJ:default'],
      ],
      keyringId: '01JKAF3DSGM3AB87EM9N0K41AJ',
      isSRPBackedUp: true,
    });
  });

  it('should return multichainAccounts and keyringId with undefined isSRPBackedUp for non-primary SRP', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return mockRawMultichainAccounts;
      }
      return true;
    });

    // Set up keyring data so that the matching keyring is not at index 0
    const reversedKeyrings = [...mockHdKeyrings].reverse();
    (useHdKeyringsWithSnapAccounts as jest.Mock).mockReturnValue(
      reversedKeyrings,
    );

    const { result } = renderHook(() => useWalletInfo(mockWalletId));

    // Now the matching keyring is at index 1 (non-primary)
    expect(result.current).toEqual({
      multichainAccounts: [
        mockRawMultichainAccounts['01JKAF3DSGM3AB87EM9N0K41AJ:default'],
      ],
      keyringId: '01JKAF3DSGM3AB87EM9N0K41AJ',
      isSRPBackedUp: undefined, // Not primary SRP, so backup status is undefined
    });
  });

  it('should return multichainAccounts and undefined keyringId when keyring not found', () => {
    // Setup mocks for the keyring not found case
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return mockRawMultichainAccounts;
      }
      return true; // For backup status
    });

    // Create a scenario where no keyring matches
    (useHdKeyringsWithSnapAccounts as jest.Mock).mockReturnValue([
      {
        metadata: {
          id: 'different-id',
          name: 'Different Wallet',
        },
        accounts: [],
      },
    ]);

    const { result } = renderHook(() => useWalletInfo(mockWalletId));

    expect(result.current).toEqual({
      multichainAccounts: [
        mockRawMultichainAccounts['01JKAF3DSGM3AB87EM9N0K41AJ:default'],
      ],
      keyringId: undefined,
    });
  });
});
