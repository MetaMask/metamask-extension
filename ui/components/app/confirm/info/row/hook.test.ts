import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';

import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { useFallbackDisplayName } from './hook';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useContext: jest.requireActual('react').useContext,
}));

jest.mock('../../../../../selectors', () => ({
  getAddressBookEntry: jest.fn(),
  getEnsResolutionByAddress: jest.fn(),
  getMetadataContractName: jest.fn(),
}));

jest.mock('../../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupsByAddress: jest.fn(),
}));

type MockSelector = <TSelected = unknown>(
  selector: (state: unknown) => TSelected,
) => TSelected;

const mockUseSelector = useSelector as jest.MockedFunction<MockSelector>;

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

    it('returns address book contact name when account name is not available', () => {
      const mockContactName = 'John Doe';

      setupMocks({
        getAddressBookEntry: { name: mockContactName },
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('returns metadata contract name when account name and address book contact are not available', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getMetadataContractName: mockMetadataName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('returns ENS name when other names are not available', () => {
      const mockEnsName = 'johndoe.eth';

      setupMocks({
        getEnsResolutionByAddress: mockEnsName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockEnsName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('returns shortened address when no other names are available', () => {
      setupMocks();

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('prioritizes account name over other names', () => {
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

    it('prioritizes address book contact name over metadata and ENS names', () => {
      const mockContactName = 'John Doe';

      setupMocks({
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

    it('prioritizes metadata name over ENS name', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getMetadataContractName: mockMetadataName,
        getEnsResolutionByAddress: 'johndoe.eth',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('handles multichain accounts state correctly', () => {
      setupMocks({
        getAccountGroupsByAddress: [
          { metadata: { name: 'Multichain Account' } },
        ],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe('Multichain Account');
    });

    it('handles empty account group in multichain state', () => {
      setupMocks({
        getAccountGroupsByAddress: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('handles undefined account group metadata', () => {
      setupMocks({
        getAccountGroupsByAddress: [{ metadata: undefined }],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: expectedShortenedAddress,
        hexAddress: expectedChecksumAddress,
      });
    });

    it('calls utility functions with correct parameters', () => {
      setupMocks();

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe(expectedShortenedAddress);
      expect(result.current.hexAddress).toBe(expectedChecksumAddress);
    });
  });
});
