import { it as jestIt } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { Severity } from '../../../../helpers/constants/design-system';
import * as confirmContext from '../../context/confirm';
import * as safeChains from '../../../../components/multichain/networks-form/use-safe-chains';
import * as rpcUtils from '../../../../../shared/lib/rpc.utils';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import * as mv3Utils from '../../../../../shared/lib/mv3.utils';
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
  {
    chainId: '30',
    name: 'Rootstock Mainnet',
    nativeCurrency: { symbol: 'RBTC' },
    rpc: ['https://public-node.rsk.co', 'https://mycrypto.rsk.co'],
  },
];

const mockUseConfirmContext = jest.fn();
const mockJsonRpcRequest = jest.fn();
const mockUseSelector = jest.fn();

type NetworkPolicyUiState = {
  completedOnboarding: boolean;
  useExternalServices: boolean;
  firstTimeFlowType?: FirstTimeFlowType;
  authConnection?: string;
  preferences?: { hasLinkedSocialLoginProfile: boolean };
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../../../shared/lib/mv3.utils', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest's ESM marker preserves the mocked module identity.
  __esModule: true,
  isManifestV3: true,
}));

const renderHookWithWait = async () => {
  const hookResult = renderHook(() => useAddEthereumChainAlerts());
  const prevUpdate0 = hookResult.result.current;
  await waitFor(() => {
    expect(hookResult.result.current).not.toBe(prevUpdate0);
  });
  return hookResult;
};

describe('useAddEthereumChainAlerts', () => {
  beforeEach(() => {
    mockJsonRpcRequest.mockReset();
    mockUseSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          completedOnboarding: true,
          useExternalServices: true,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      }),
    );
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

  it('retains existing automatic RPC checks on Firefox without DNR', async () => {
    jest.replaceProperty(mv3Utils, 'isManifestV3', false);
    mockUseSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          completedOnboarding: true,
          useExternalServices: false,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      }),
    );
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://unapproved.example/rpc',
          ticker: 'ETH',
        },
      },
    });

    renderHook(() => useAddEthereumChainAlerts());

    await waitFor(() => {
      expect(mockJsonRpcRequest).toHaveBeenCalledWith(
        'https://unapproved.example/rpc',
        'eth_chainId',
      );
    });
  });

  jestIt.each([
    {
      completedOnboarding: false,
      useExternalServices: true,
      firstTimeFlowType: FirstTimeFlowType.socialCreate,
      authConnection: 'google',
    },
    {
      completedOnboarding: true,
      useExternalServices: false,
      firstTimeFlowType: FirstTimeFlowType.create,
    },
    {
      completedOnboarding: true,
      useExternalServices: false,
      firstTimeFlowType: FirstTimeFlowType.import,
      authConnection: 'google',
      preferences: { hasLinkedSocialLoginProfile: true },
    },
    {
      completedOnboarding: true,
      useExternalServices: false,
      firstTimeFlowType: FirstTimeFlowType.restore,
      authConnection: 'google',
    },
    {
      completedOnboarding: true,
      useExternalServices: false,
      authConnection: 'google',
    },
  ])(
    'keeps local warnings without contacting an unapproved RPC (%j)',
    (metamask: NetworkPolicyUiState) => {
      mockUseSelector.mockImplementation((selector) => selector({ metamask }));
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          requestData: {
            chainId: '0x1',
            chainName: 'Unexpected Ethereum',
            rpcUrl: 'https://unapproved.example/rpc',
            ticker: 'ETH',
          },
        },
      });

      const { result } = renderHook(() => useAddEthereumChainAlerts());

      expect(mockJsonRpcRequest).not.toHaveBeenCalled();
      expect(result.current).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'mismatchedNetworkName' }),
          expect.objectContaining({ key: 'mismatchedRpcUrl' }),
        ]),
      );
      expect(result.current).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'errorWhileConnectingToRPC' }),
        ]),
      );
    },
  );

  jestIt.each([
    { firstTimeFlowType: FirstTimeFlowType.socialCreate },
    { firstTimeFlowType: FirstTimeFlowType.socialImport },
  ])(
    'retains automatic checks for a social wallet (%j)',
    async (
      socialState: Pick<
        NetworkPolicyUiState,
        'firstTimeFlowType' | 'authConnection'
      >,
    ) => {
      mockUseSelector.mockImplementation((selector) =>
        selector({
          metamask: {
            completedOnboarding: true,
            useExternalServices: false,
            ...socialState,
          },
        }),
      );
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          requestData: {
            chainId: '0x1',
            chainName: 'Ethereum',
            rpcUrl: 'https://mainnet.infura.io/v3/abc',
            ticker: 'ETH',
          },
        },
      });

      await renderHookWithWait();

      expect(mockJsonRpcRequest).toHaveBeenCalledWith(
        'https://mainnet.infura.io/v3/abc',
        'eth_chainId',
      );
    },
  );

  it('returns empty array when there is no current confirmation', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: undefined,
    });

    const { result, rerender } = renderHook(() => useAddEthereumChainAlerts());
    expect(result.current).toEqual([]);
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('returns empty array when chain is not in safe list', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1234',
          rpcUrl: 'https://example.com/rpc',
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    expect(result.current).toEqual([]);
  });

  it('returns homograph RPC alert for unrecognized chain', async () => {
    const spoofedRpcUrl = 'https://iոfura.io/v3/abc';

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1234',
          rpcUrl: spoofedRpcUrl,
        },
      },
    });

    const { result } = renderHook(() => useAddEthereumChainAlerts());

    await waitFor(() => {
      expect(result.current).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'rpcUrlIdnHomograph',
            severity: Severity.Warning,
          }),
        ]),
      );
    });
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

  it('does not warn for a RouteMesh RPC URL matching the requested chain', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1e',
          chainName: 'Rootstock Mainnet',
          rpcUrl: 'https://lb.routeme.sh/rpc/evm/30',
          ticker: 'RBTC',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedRpcUrl',
        }),
      ]),
    );
  });

  it('does not warn for a matching RouteMesh RPC URL with a trailing slash', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1e',
          chainName: 'Rootstock Mainnet',
          rpcUrl: 'https://lb.routeme.sh/rpc/evm/30/',
          ticker: 'RBTC',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'mismatchedRpcUrl',
        }),
      ]),
    );
  });

  it('warns for a RouteMesh RPC URL with a different chain ID', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1e',
          chainName: 'Rootstock Mainnet',
          rpcUrl: 'https://lb.routeme.sh/rpc/evm/31',
          ticker: 'RBTC',
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

  it('warns for a RouteMesh RPC URL with a spoofed hostname', async () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1e',
          chainName: 'Rootstock Mainnet',
          rpcUrl: 'https://lb.routeme.sh.example.com/rpc/evm/30',
          ticker: 'RBTC',
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

  it('warns that the provider is rate limiting when the chain ID request is throttled', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockJsonRpcRequest.mockRejectedValue(
      new rpcUtils.JsonRpcRequestError('public rate limit exceeded', {
        code: -32029,
        httpStatus: 429,
      }),
    );
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1e',
          chainName: 'Rootstock Mainnet',
          rpcUrl: 'https://lb.routeme.sh/rpc/evm/30',
          ticker: 'RBTC',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'rpcUrlRateLimited',
          severity: Severity.Warning,
          field: 'rpcUrl',
        }),
      ]),
    );
    expect(result.current).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'errorWhileConnectingToRPC' }),
      ]),
    );
  });

  it('warns about a connection failure when the chain ID request fails for another reason', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockJsonRpcRequest.mockRejectedValue(new Error('network error'));
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://mainnet.infura.io/v3/abc',
        },
      },
    });

    const { result } = await renderHookWithWait();

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'errorWhileConnectingToRPC',
          severity: Severity.Warning,
          field: 'rpcUrl',
        }),
      ]),
    );
  });
});
