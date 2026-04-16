import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { useAddEthereumChainRequest } from './useAddEthereumChainRequest';

const ID_MOCK = '123-456';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

const ADD_CHAIN_APPROVAL_MOCK = {
  id: ID_MOCK,
  type: ApprovalType.AddEthereumChain,
  time: 1,
  origin: 'https://test.com',
  requestData: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    ticker: 'ETH',
    rpcUrl: 'https://rpc.test.com',
    rpcPrefs: {
      blockExplorerUrl: 'https://etherscan.io',
    },
  },
  requestState: null,
  expectsResult: false,
};

function buildState({
  pendingApprovals,
}: {
  pendingApprovals?: Record<string, typeof ADD_CHAIN_APPROVAL_MOCK>;
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: pendingApprovals ?? {},
    },
  };
}

function runHook(state: ReturnType<typeof buildState>) {
  const { result } = renderHookWithProvider(useAddEthereumChainRequest, state);
  return result.current;
}

describe('useAddEthereumChainRequest', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns approval data when pending approval is AddEthereumChain type', () => {
    const result = runHook(
      buildState({
        pendingApprovals: {
          [ID_MOCK]: ADD_CHAIN_APPROVAL_MOCK,
        },
      }),
    );

    expect(result).toStrictEqual(ADD_CHAIN_APPROVAL_MOCK);
  });

  it('returns undefined when no pending approval exists', () => {
    const result = runHook(buildState({ pendingApprovals: {} }));

    expect(result).toBeUndefined();
  });

  it('returns undefined when pending approval is not AddEthereumChain type', () => {
    const result = runHook(
      buildState({
        pendingApprovals: {
          [ID_MOCK]: {
            ...ADD_CHAIN_APPROVAL_MOCK,
            type: ApprovalType.Transaction,
          },
        },
      }),
    );

    expect(result).toBeUndefined();
  });
});
