import { renderHook } from '@testing-library/react-hooks';
import { Severity } from '../../../../helpers/constants/design-system';
import * as confirmContext from '../../context/confirm';
import * as safeChains from '../../../settings/networks-tab/networks-form/use-safe-chains';
import * as rpcUtils from '../../../../../shared/modules/rpc.utils';
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

const mockUseConfirmContext = jest.fn();
const mockJsonRpcRequest = jest.fn();

const renderHookWithWait = async () => {
  const hookResult = renderHook(() => useAddEthereumChainAlerts());
  await hookResult.waitForNextUpdate();
  return hookResult;
};

describe('useAddEthereumChainAlerts', () => {
  beforeEach(() => {
    jest
      .spyOn(confirmContext, 'useConfirmContext')
      .mockImplementation(mockUseConfirmContext);

    jest.spyOn(safeChains, 'useSafeChains').mockReturnValue({
      safeChains: mockSafeChains,
    });

    jest
      .spyOn(rpcUtils, 'jsonRpcRequest')
      .mockImplementation(mockJsonRpcRequest);

    mockJsonRpcRequest.mockImplementation(
      async (_url: string, method: string) => {
        if (method === 'eth_chainId') {
          const confirmation = mockUseConfirmContext().currentConfirmation;
          return confirmation?.requestData?.chainId || '0x1';
        }
        return null;
      },
    );
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

  it('returns empty array when chain is not in safe list', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1234',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual([]);
  });

  it('warns on mismatched network name', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Not Ethereum',
          rpcUrl: 'https://mainnet.infura.io/v3/abc',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedNetworkName',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on mismatched ticker', async () => {
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

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedNetworkSymbol',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on mismatched rpc origin', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://example.com/rpc',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedRpcUrl',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('warns on deprecated networks', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x5',
          chainName: 'Goerli',
          rpcUrl: 'https://goerli.infura.io/v3/abc',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'deprecatedNetwork',
          severity: Severity.Warning,
        }),
      ]),
    );
  });

  it('shows error when RPC returns mismatched chain ID', async () => {
    mockJsonRpcRequest.mockResolvedValue('0x89'); // Polygon chain ID
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1', // Ethereum chain ID
          chainName: 'Ethereum',
          rpcUrl: 'https://polygon-rpc.com',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedRpcChainId',
          severity: Severity.Warning,
          field: 'chainName',
        }),
      ]),
    );
  });
});
