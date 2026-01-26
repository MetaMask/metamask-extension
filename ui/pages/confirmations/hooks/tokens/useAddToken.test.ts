import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import * as actions from '../../../../store/actions';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useAddToken } from './useAddToken';

const mockDispatch = jest.fn();
const mockAddToken = jest.fn();
const mockFindNetworkClientIdByChainId = jest.fn();
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  addToken: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../../../hooks/useAsync');

const mockUseAsyncResult = useAsyncResult as jest.MockedFunction<
  typeof useAsyncResult
>;

type SelectorFunction = (state: unknown) => unknown;

describe('useAddToken', () => {
  const mockTokenParams = {
    chainId: '0x1' as Hex,
    decimals: 18,
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Hex,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (actions.addToken as jest.Mock).mockImplementation(mockAddToken);
    (actions.findNetworkClientIdByChainId as jest.Mock).mockImplementation(
      mockFindNetworkClientIdByChainId,
    );

    mockDispatch.mockResolvedValue(undefined);
    mockFindNetworkClientIdByChainId.mockResolvedValue('mainnet');
    mockAddToken.mockReturnValue({ type: 'ADD_TOKEN' });

    mockUseAsyncResult.mockImplementation((asyncFn) => {
      asyncFn().catch(() => {
        // Errors are handled in the hook
      });
      return { error: null };
    });

    mockUseSelector.mockImplementation((selector: SelectorFunction) => {
      const selectorString = selector.toString();
      if (selectorString.includes('getAllTokens')) {
        return {};
      }
      if (selectorString.includes('getSelectedInternalAccount')) {
        return { address: '0xUserAddress' };
      }
      return null;
    });
  });

  describe('when token already exists in wallet', () => {
    it('does not add token', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {
            '0x1': {
              '0xUserAddress': [
                {
                  address: mockTokenParams.tokenAddress.toLowerCase(),
                  symbol: 'DAI',
                  decimals: 18,
                },
              ],
            },
          };
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    it('handles case-insensitive address comparison', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {
            '0x1': {
              '0xUserAddress': [
                {
                  address: mockTokenParams.tokenAddress.toUpperCase(),
                  symbol: 'DAI',
                  decimals: 18,
                },
              ],
            },
          };
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });
  });

  describe('when token does not exist in wallet', () => {
    it('adds token with correct parameters', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
          mockTokenParams.chainId,
        );
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'ADD_TOKEN',
        });
        expect(mockAddToken).toHaveBeenCalledWith(
          {
            address: mockTokenParams.tokenAddress,
            symbol: mockTokenParams.symbol,
            decimals: mockTokenParams.decimals,
            networkClientId: 'mainnet',
          },
          true,
        );
      });
    });

    it('adds token when other tokens exist for different chains', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {
            '0x89': {
              '0xUserAddress': [
                {
                  address: '0xOtherToken',
                  symbol: 'OTHER',
                  decimals: 6,
                },
              ],
            },
          };
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
          mockTokenParams.chainId,
        );
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('adds token when other tokens exist for same chain but different address', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {
            '0x1': {
              '0xUserAddress': [
                {
                  address: '0xDifferentTokenAddress',
                  symbol: 'USDC',
                  decimals: 6,
                },
              ],
            },
          };
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
          mockTokenParams.chainId,
        );
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('networkClientId lookup', () => {
    it('calls findNetworkClientIdByChainId with correct chainId', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      const customChainId = '0x89' as Hex;
      const customParams = {
        ...mockTokenParams,
        chainId: customChainId,
      };

      renderHook(() => useAddToken(customParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
          customChainId,
        );
      });
    });

    it('uses networkClientId returned from findNetworkClientIdByChainId', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      mockFindNetworkClientIdByChainId.mockResolvedValue('polygon-mainnet');

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockAddToken).toHaveBeenCalledWith(
          expect.objectContaining({
            networkClientId: 'polygon-mainnet',
          }),
          true,
        );
      });
    });
  });

  describe('dontShowLoadingIndicator flag', () => {
    it('passes true as second parameter to addToken', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockAddToken).toHaveBeenCalledWith(expect.any(Object), true);
      });
    });
  });

  describe('error handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('handles errors from findNetworkClientIdByChainId silently', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      const error = new Error('Network client not found');
      mockFindNetworkClientIdByChainId.mockRejectedValue(error);

      mockUseAsyncResult.mockImplementation((asyncFn: () => Promise<void>) => {
        asyncFn().catch(() => {
          // Error is caught
        });
        return { error };
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to add token',
          expect.objectContaining({
            tokenAddress: mockTokenParams.tokenAddress,
            chainId: mockTokenParams.chainId,
            error,
          }),
        );
      });
    });

    it('handles errors from addToken dispatch silently', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      const error = new Error('Failed to add token to state');
      mockDispatch.mockRejectedValue(error);

      mockUseAsyncResult.mockImplementation((asyncFn: () => Promise<void>) => {
        asyncFn().catch(() => {
          // Error is caught
        });
        return { error };
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to add token',
          expect.objectContaining({
            tokenAddress: mockTokenParams.tokenAddress,
            chainId: mockTokenParams.chainId,
            error,
          }),
        );
      });
    });

    it('does not throw errors to caller', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      mockFindNetworkClientIdByChainId.mockRejectedValue(
        new Error('Network error'),
      );

      expect(() => {
        renderHook(() => useAddToken(mockTokenParams));
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles missing allTokens gracefully', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return null;
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('handles missing selectedAccount gracefully', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {};
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return null;
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('handles empty tokens array for chain', async () => {
      mockUseSelector.mockImplementation((selector: SelectorFunction) => {
        const selectorString = selector.toString();
        if (selectorString.includes('getAllTokens')) {
          return {
            '0x1': {
              '0xUserAddress': [],
            },
          };
        }
        if (selectorString.includes('getSelectedInternalAccount')) {
          return { address: '0xUserAddress' };
        }
        return null;
      });

      renderHook(() => useAddToken(mockTokenParams));

      await waitFor(() => {
        expect(mockFindNetworkClientIdByChainId).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });
});
