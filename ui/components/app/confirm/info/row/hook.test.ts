import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useRowContext, useFallbackDisplayName } from './hook';
import { ConfirmInfoRowContext, ConfirmInfoRowVariant } from './row';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useContext: jest.requireActual('react').useContext,
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

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockToChecksumHexAddress = toChecksumHexAddress as jest.MockedFunction<
  typeof toChecksumHexAddress
>;
const mockShortenAddress = shortenAddress as jest.MockedFunction<
  typeof shortenAddress
>;

describe('hook.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFallbackDisplayName', () => {
    const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const mockChecksumAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const mockShortenedAddress = '0xd8dA...6045';

    const setupMockSelector = (overrides: Record<string, any> = {}) => {
      const defaultSelectors = {
        getAccountGroupsByAddress: [],
        getInternalAccounts: [],
      };

      const allSelectors = { ...defaultSelectors, ...overrides };

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();

        const match = Object.entries(allSelectors).find(([key]) =>
          selectorStr.includes(key),
        );

        return match ? match[1] : null;
      });
    };

    const renderHookWithMocks = (
      selectorOverrides: Record<string, any> = {},
    ) => {
      setupMockSelector(selectorOverrides);
      return renderHook(() => useFallbackDisplayName(mockAddress));
    };

    beforeEach(() => {
      mockToChecksumHexAddress.mockReturnValue(mockChecksumAddress);
      mockShortenAddress.mockReturnValue(mockShortenedAddress);
      setupMockSelector();
    });

    it('returns account name when available (legacy accounts)', () => {
      const mockAccountName = 'My Account';

      const { result } = renderHookWithMocks({
        getAccountName: mockAccountName,
        accountName: mockAccountName,
      });

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
      expect(mockToChecksumHexAddress).toHaveBeenCalledWith(mockAddress);
    });

    it('returns account name when available (multichain accounts)', () => {
      const mockAccountName = 'My Multichain Account';

      const { result } = renderHookWithMocks({
        getIsMultichainAccountsState2Enabled: true,
        getAccountGroupsByAddress: [{ metadata: { name: mockAccountName } }],
      });

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return address book contact name when account name is not available', () => {
      const mockContactName = 'John Doe';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (selectorStr.includes('getAddressBookEntry')) {
          return { name: mockContactName };
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return metadata contract name when account name and address book contact are not available', () => {
      const mockMetadataName = 'USDC Token';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (selectorStr.includes('getMetadataContractName')) {
          return mockMetadataName;
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return ENS name when other names are not available', () => {
      const mockEnsName = 'johndoe.eth';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (selectorStr.includes('getEnsResolutionByAddress')) {
          return mockEnsName;
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockEnsName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should return shortened address when no other names are available', () => {
      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
      expect(mockShortenAddress).toHaveBeenCalledWith(mockChecksumAddress);
    });

    it('should prioritize account name over other names', () => {
      const mockAccountName = 'My Account';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (
          selectorStr.includes('getAccountName') ||
          selectorStr.includes('accountName')
        ) {
          return mockAccountName;
        }
        if (selectorStr.includes('getAddressBookEntry')) {
          return { name: 'John Doe' };
        }
        if (selectorStr.includes('getMetadataContractName')) {
          return 'USDC Token';
        }
        if (selectorStr.includes('getEnsResolutionByAddress')) {
          return 'johndoe.eth';
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockAccountName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should prioritize address book contact name over metadata and ENS names', () => {
      const mockContactName = 'John Doe';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (selectorStr.includes('getAddressBookEntry')) {
          return { name: mockContactName };
        }
        if (selectorStr.includes('getMetadataContractName')) {
          return 'USDC Token';
        }
        if (selectorStr.includes('getEnsResolutionByAddress')) {
          return 'johndoe.eth';
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockContactName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should prioritize metadata name over ENS name', () => {
      const mockMetadataName = 'USDC Token';

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        if (selectorStr.includes('getMetadataContractName')) {
          return mockMetadataName;
        }
        if (selectorStr.includes('getEnsResolutionByAddress')) {
          return 'johndoe.eth';
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockMetadataName,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should handle multichain accounts state correctly', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getIsMultichainAccountsState2Enabled')) {
          return true;
        }
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [{ metadata: { name: 'Multichain Account' } }];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current.displayName).toBe('Multichain Account');
    });

    it('should handle empty account group in multichain state', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getIsMultichainAccountsState2Enabled')) {
          return true;
        }
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should handle undefined account group metadata', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();
        if (selectorStr.includes('getIsMultichainAccountsState2Enabled')) {
          return true;
        }
        if (selectorStr.includes('getAccountGroupsByAddress')) {
          return [{ metadata: undefined }];
        }
        if (selectorStr.includes('getInternalAccounts')) {
          return [];
        }
        return null;
      });

      const { result } = renderHook(() => useFallbackDisplayName(mockAddress));

      expect(result.current).toEqual({
        displayName: mockShortenedAddress,
        hexAddress: mockChecksumAddress,
      });
    });

    it('should call utility functions with correct parameters', () => {
      renderHook(() => useFallbackDisplayName(mockAddress));

      expect(mockToChecksumHexAddress).toHaveBeenCalledWith(mockAddress);
      expect(mockShortenAddress).toHaveBeenCalledWith(mockChecksumAddress);
    });
  });
});
