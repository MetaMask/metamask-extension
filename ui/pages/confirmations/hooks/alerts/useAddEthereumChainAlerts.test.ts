import { renderHook } from '@testing-library/react-hooks';
import { Severity } from '../../../../helpers/constants/design-system';
import * as confirmContext from '../../context/confirm';
import * as safeChains from '../../../settings/networks-tab/networks-form/use-safe-chains';
import { useAddEthereumChainAlerts } from './useAddEthereumChainAlerts';

const mockSafeChains = [
  {
    chainId: '1',
    name: 'Ethereum',
    nativeCurrency: { symbol: 'ETH' },
    rpc: ['https://mainnet.infura.io/v3/abc'],
  },
  {
    chainId: '5',
    name: 'Goerli',
    nativeCurrency: { symbol: 'ETH' },
    rpc: ['https://goerli.infura.io/v3/abc'],
  },
];

describe('useAddEthereumChainAlerts', () => {
  const mockUseConfirmContext = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(confirmContext, 'useConfirmContext')
      .mockImplementation(mockUseConfirmContext);

    jest.spyOn(safeChains, 'useSafeChains').mockReturnValue({
      safeChains: mockSafeChains,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array when there is no current confirmation', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: undefined,
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());
    expect(result.current).toEqual([]);
  });

  it('returns empty array when chain is not in safe list', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1234',
          chainName: 'Unknown',
          rpcUrl: 'https://unknown.rpc',
          ticker: 'UNK',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual([]);
  });

  it('warns on mismatched network name', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Not Ethereum',
          rpcUrl: 'https://mainnet.infura.io/v3/abc',
          ticker: 'ETH',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedNetworkName',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on mismatched ticker', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://mainnet.infura.io/v3/abc',
          ticker: 'WRONG',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedNetworkSymbol',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on mismatched rpc origin', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://example.com/rpc',
          ticker: 'ETH',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedRpcUrl',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on deprecated networks', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x5',
          chainName: 'Goerli',
          rpcUrl: 'https://goerli.infura.io/v3/abc',
          ticker: 'ETH',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'deprecatedNetwork',
          severity: Severity.Warning,
        }),
      ]),
    );
  });
});
