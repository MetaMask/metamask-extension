import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';

import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { getAccountName, getInternalAccounts } from '../../../../../selectors';
import { useFallbackDisplayName } from './hook';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useContext: jest.requireActual('react').useContext,
}));

jest.mock('../../../../../selectors', () => ({
  getAccountName: jest.fn(),
  getAddressBookEntry: jest.fn(),
  getEnsResolutionByAddress: jest.fn(),
  getInternalAccounts: jest.fn(),
  getMetadataContractName: jest.fn(),
}));

jest.mock('../../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupsByAddress: jest.fn(),
}));

type MockSelector = <TSelected = unknown>(
  selector: (state: unknown) => TSelected,
) => TSelected;

const mockUseSelector = useSelector as jest.MockedFunction<MockSelector>;

const mockGetAccountName = getAccountName as jest.MockedFunction<
  typeof getAccountName
>;

describe('hook.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFallbackDisplayName', () => {
    const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const expectedChecksumAddress = toChecksumHexAddress(mockAddress);
    const expectedShortenedAddress = shortenAddress(expectedChecksumAddress);

    const setupMocks = (overrides: Record<string, unknown> = {}) => {
      // Setup useSelector mock
      mockUseSelector.mockImplementation((selector) => {
        if (selector === getInternalAccounts) {
          return overrides.getInternalAccounts ?? [];
        }
        // Handle function selectors that take arguments
        if (typeof selector === 'function') {
          // This is for inline arrow functions like (state) => getAccountGroupsByAddress(state, [hexAddress])
          if (selector.toString().includes('getAccountGroupsByAddress')) {
            return overrides.getAccountGroupsByAddress ?? [];
          }
          if (selector.toString().includes('getAddressBookEntry')) {
            return overrides.getAddressBookEntry ?? null;
          }
          if (selector.toString().includes('getMetadataContractName')) {
            return overrides.getMetadataContractName ?? null;
          }
          if (selector.toString().includes('getEnsResolutionByAddress')) {
            return overrides.getEnsResolutionByAddress ?? null;
          }
        }
        return null;
      });

      // Setup direct function mocks
      mockGetAccountName.mockReturnValue(overrides.accountName || '');
    };

    beforeEach(() => {
      setupMocks();
    });

    it('returns account name when available', () => {
      const mockAccountName = 'My Multichain Account';

      setupMocks({
        getAccountGroupsByAddress: [{ metadata: { name: mockAccountName } }],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should return address book contact name when account name is not available', () => {
      const mockContactName = 'John Doe';

      setupMocks({
        getAccountGroupsByAddress: [],
        getAddressBookEntry: { name: mockContactName },
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should return metadata contract name when account name and address book contact are not available', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getAccountGroupsByAddress: [],
        getMetadataContractName: mockMetadataName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should return ENS name when other names are not available', () => {
      const mockEnsName = 'johndoe.eth';

      setupMocks({
        getAccountGroupsByAddress: [],
        getEnsResolutionByAddress: mockEnsName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockEnsName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should return shortened address when no other names are available', () => {
      setupMocks({
        getAccountGroupsByAddress: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should prioritize account name over other names', () => {
      const mockAccountName = 'My Account';

      setupMocks({
        getAccountGroupsByAddress: [{ metadata: { name: mockAccountName } }],
        getAddressBookEntry: { name: 'John Doe' },
        getMetadataContractName: 'USDC Token',
        getEnsResolutionByAddress: 'johndoe.eth',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should prioritize address book contact name over metadata and ENS names', () => {
      const mockContactName = 'John Doe';

      setupMocks({
        getAccountGroupsByAddress: [],
        getAddressBookEntry: { name: mockContactName },
        getMetadataContractName: 'USDC Token',
        getEnsResolutionByAddress: 'johndoe.eth',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should prioritize metadata name over ENS name', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getAccountGroupsByAddress: [],
        getMetadataContractName: mockMetadataName,
        getEnsResolutionByAddress: 'johndoe.eth',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should handle multichain accounts state correctly', () => {
      setupMocks({
        getAccountGroupsByAddress: [
          { metadata: { name: 'Multichain Account' } },
        ],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe('Multichain Account');
    });

    it('should handle empty account group in multichain state', () => {
      setupMocks({
        getAccountGroupsByAddress: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should handle undefined account group metadata', () => {
      setupMocks({
        getAccountGroupsByAddress: [{ metadata: undefined }],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('should call utility functions with correct parameters', () => {
      setupMocks({
        getAccountGroupsByAddress: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe(expectedShortenedAddress);
      expect(result.current.hexAddress).toBe(expectedChecksumAddress);
    });
  });
});
