import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import type { InternalAccount } from '@metamask/keyring-internal-api';

import { useRowContext, useFallbackDisplayName } from './hook';
import { ConfirmInfoRowContext, ConfirmInfoRowVariant } from './row';
import type { AccountGroupWithInternalAccounts } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { createMockInternalAccount } from '../../../../../../test/jest/mocks';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useContext: jest.requireActual('react').useContext,
}));

jest.mock('../../../../../selectors', () => ({
  getAccountName: jest.fn(),
  getAddressBookEntry: jest.fn(),
  getEnsResolutionByAddress: jest.fn(),
  getInternalAccounts: jest.fn(),
  getIsMultichainAccountsState2Enabled: jest.fn(),
  getMetadataContractName: jest.fn(),
}));

jest.mock('../../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupsByAddress: jest.fn(),
}));

jest.mock('../../../../../../shared/modules/hexstring-utils', () => ({
  toChecksumHexAddress: jest.fn(),
  stripHexPrefix: jest.fn((value) => value?.replace?.(/^0x/i, '') || ''),
}));

jest.mock('../../../../../helpers/utils/util', () => ({
  shortenAddress: jest.fn(),
}));

import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  getAccountName,
  getAddressBookEntry,
  getEnsResolutionByAddress,
  getInternalAccounts,
  getIsMultichainAccountsState2Enabled,
  getMetadataContractName,
} from '../../../../../selectors';
import { getAccountGroupsByAddress } from '../../../../../selectors/multichain-accounts/account-tree';

type MockSelector = <TSelected = unknown>(
  selector: (state: unknown) => TSelected,
) => TSelected;

const mockUseSelector = useSelector as jest.MockedFunction<MockSelector>;
const mockToChecksumHexAddress = toChecksumHexAddress as jest.MockedFunction<
  typeof toChecksumHexAddress
>;
const mockShortenAddress = shortenAddress as jest.MockedFunction<
  typeof shortenAddress
>;

// Mock selector functions
const mockGetAccountName = getAccountName as jest.MockedFunction<
  typeof getAccountName
>;
const mockGetAddressBookEntry = getAddressBookEntry as jest.MockedFunction<
  typeof getAddressBookEntry
>;
const mockGetEnsResolutionByAddress =
  getEnsResolutionByAddress as jest.MockedFunction<
    typeof getEnsResolutionByAddress
  >;
const mockGetInternalAccounts = getInternalAccounts as jest.MockedFunction<
  typeof getInternalAccounts
>;
const mockGetIsMultichainAccountsState2Enabled =
  getIsMultichainAccountsState2Enabled as jest.MockedFunction<
    typeof getIsMultichainAccountsState2Enabled
  >;
const mockGetMetadataContractName =
  getMetadataContractName as jest.MockedFunction<
    typeof getMetadataContractName
  >;
const mockGetAccountGroupsByAddress =
  getAccountGroupsByAddress as jest.MockedFunction<
    typeof getAccountGroupsByAddress
  >;

describe('hook.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFallbackDisplayName', () => {
    const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const mockChecksumAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const mockShortenedAddress = '0xd8dA...6045';

    const setupMocks = (overrides: Record<string, unknown> = {}) => {
      // Setup useSelector mock
      mockUseSelector.mockImplementation((selector) => {
        if (selector === getInternalAccounts) {
          return overrides.getInternalAccounts ?? [];
        }
        if (selector === getIsMultichainAccountsState2Enabled) {
          return overrides.getIsMultichainAccountsState2Enabled ?? false;
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
      mockToChecksumHexAddress.mockReturnValue(mockChecksumAddress);
      mockShortenAddress.mockReturnValue(mockShortenedAddress);
      setupMocks();
    });

    it('returns account name when available (legacy accounts)', () => {
      const mockAccountName = 'My Account';
      const mockInternalAccount = createMockInternalAccount({
        name: mockAccountName,
        address: mockChecksumAddress,
      });

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [mockInternalAccount],
        accountName: mockAccountName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
      expect(mockToChecksumHexAddress).toHaveBeenCalledWith(mockAddress);
    });

    it('returns account name when available (multichain accounts)', () => {
      const mockAccountName = 'My Multichain Account';

      setupMocks({
        getIsMultichainAccountsState2Enabled: true,
        getAccountGroupsByAddress: [{ metadata: { name: mockAccountName } }],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return address book contact name when account name is not available', () => {
      const mockContactName = 'John Doe';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getAddressBookEntry: { name: mockContactName },
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return metadata contract name when account name and address book contact are not available', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getMetadataContractName: mockMetadataName,
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return ENS name when other names are not available', () => {
      const mockEnsName = 'johndoe.eth';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getEnsResolutionByAddress: mockEnsName,
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockEnsName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return shortened address when no other names are available', () => {
      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
      expect(mockShortenAddress).toHaveBeenCalledWith(mockChecksumAddress);
    });

    it('should prioritize account name over other names', () => {
      const mockAccountName = 'My Account';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getAddressBookEntry: { name: 'John Doe' },
        getMetadataContractName: 'USDC Token',
        getEnsResolutionByAddress: 'johndoe.eth',
        accountName: mockAccountName,
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should prioritize address book contact name over metadata and ENS names', () => {
      const mockContactName = 'John Doe';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getAddressBookEntry: { name: mockContactName },
        getMetadataContractName: 'USDC Token',
        getEnsResolutionByAddress: 'johndoe.eth',
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should prioritize metadata name over ENS name', () => {
      const mockMetadataName = 'USDC Token';

      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        getMetadataContractName: mockMetadataName,
        getEnsResolutionByAddress: 'johndoe.eth',
        accountName: '',
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should handle multichain accounts state correctly', () => {
      setupMocks({
        getIsMultichainAccountsState2Enabled: true,
        getAccountGroupsByAddress: [
          { metadata: { name: 'Multichain Account' } },
        ],
        getInternalAccounts: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe('Multichain Account');
    });

    it('should handle empty account group in multichain state', () => {
      setupMocks({
        getIsMultichainAccountsState2Enabled: true,
        getAccountGroupsByAddress: [],
        getInternalAccounts: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should handle undefined account group metadata', () => {
      setupMocks({
        getIsMultichainAccountsState2Enabled: true,
        getAccountGroupsByAddress: [{ metadata: undefined }],
        getInternalAccounts: [],
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should call utility functions with correct parameters', () => {
      setupMocks({
        getIsMultichainAccountsState2Enabled: false,
        getInternalAccounts: [],
        accountName: '',
      });

      renderHook(() => useFallbackDisplayName(mockAddress));

      expect(mockToChecksumHexAddress).toHaveBeenCalledWith(mockAddress);
      expect(mockShortenAddress).toHaveBeenCalledWith(mockChecksumAddress);
    });
  });
});
