import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { ApprovalType } from '@metamask/controller-utils';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_DISTRIBUTOR_ADDRESS,
} from '../../../../../components/app/musd/constants';
import { MusdClaimInfo } from './musd-claim-info';

const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const LINEA_CHAIN_ID = '0xe708';

function encodeClaimData(amount: string): string {
  const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
  return iface.encodeFunctionData('claim', [
    [MOCK_ADDRESS],
    [MOCK_TOKEN_ADDRESS],
    [amount],
    [['0x0000000000000000000000000000000000000000000000000000000000000001']],
  ]);
}

jest.mock(
  '../../../../../components/app/confirm/info/row/alert-row/alert-row',
  () => ({
    ConfirmInfoAlertRow: ({
      children,
      label,
    }: {
      children: React.ReactNode;
      label: string;
    }) => (
      <div data-testid="alert-row">
        <span>{label}</span>
        {children}
      </div>
    ),
  }),
);

jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../../components/app/musd/merkl-client', () => ({
  getClaimedAmountFromContract: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../hooks/tokens/useTokenFiatRates', () => ({
  useTokenFiatRate: () => 1.0,
  useTokenFiatRates: () => [1.0],
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

const buildMusdClaimTransaction = (
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta =>
  ({
    actionId: String(400855682),
    chainId: LINEA_CHAIN_ID,
    id: 'musd-claim-tx-id',
    status: TransactionStatus.unapproved,
    type: TransactionType.musdClaim,
    time: Date.now(),
    txParams: {
      from: MOCK_ADDRESS,
      to: MERKL_DISTRIBUTOR_ADDRESS,
      value: '0x0',
      data: encodeClaimData('10500000'), // 10.5 MUSD (6 decimals)
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
    },
    defaultGasEstimates: {
      estimateType: 'medium',
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
    },
    gasFeeEstimatesLoaded: true,
    userEditedGasLimit: false,
    userFeeLevel: 'medium',
    verifiedOnBlockchain: false,
    origin: 'metamask',
    ...overrides,
  }) as unknown as TransactionMeta;

const buildMockState = (transaction: TransactionMeta) =>
  getMockConfirmState({
    metamask: {
      pendingApprovals: {
        [transaction.id]: {
          id: transaction.id,
          type: ApprovalType.Transaction,
        },
      },
      transactions: [transaction],
      selectedNetworkClientId: 'linea-mainnet',
      networkConfigurationsByChainId: {
        [LINEA_CHAIN_ID]: {
          chainId: LINEA_CHAIN_ID,
          name: 'Linea Mainnet',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'linea-mainnet',
              url: 'https://rpc.linea.build',
              type: 'custom',
            },
          ],
          defaultRpcEndpointIndex: 0,
        },
      },
      networksMetadata: {
        'linea-mainnet': {
          EIPS: { 1559: true },
          status: 'available',
        },
      },
    },
  });

describe('MusdClaimInfo', () => {
  it('renders all main sections: heading, details, network, and gas', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // Hero heading is rendered
    expect(screen.getByTestId('musd-claim-heading')).toBeInTheDocument();

    // Details section (ClaimingToRow) is rendered
    expect(screen.getByTestId('musd-claim-details-section')).toBeInTheDocument();

    // Network section is rendered
    expect(screen.getByTestId('musd-claim-network-section')).toBeInTheDocument();

    // Gas fee section is rendered
    expect(screen.getByTestId('musd-claim-gas-section')).toBeInTheDocument();
  });

  it('displays "Claiming to" label in the details section', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // ClaimingToRow displays the "Claiming to" label
    expect(screen.getByText('Claiming to')).toBeInTheDocument();
  });

  it('displays "Network" label in the network section', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // ClaimNetworkRow displays the "Network" label
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('displays the network name from transaction chainId', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // Network name should show Linea Mainnet
    expect(screen.getByText('Linea Mainnet')).toBeInTheDocument();
  });

  it('displays claim amount with MUSD symbol in the heading', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // Wait for the claim amount to load
    await waitFor(() => {
      expect(screen.getByTestId('musd-claim-heading-amount')).toBeInTheDocument();
    });

    // Should display MUSD symbol
    const headingAmount = screen.getByTestId('musd-claim-heading-amount');
    expect(headingAmount.textContent).toContain('MUSD');
  });

  it('displays fiat value when available', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // Wait for the fiat value to load and be displayed
    await waitFor(() => {
      expect(screen.getByTestId('musd-claim-heading-fiat')).toBeInTheDocument();
    });
  });

  it('displays account info in the ClaimingToRow', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = buildMockState(transaction);
    const mockStore = configureMockStore()(state);

    await act(async () => {
      renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);
    });

    // The details section should contain account information
    const detailsSection = screen.getByTestId('musd-claim-details-section');
    expect(detailsSection).toBeInTheDocument();

    // Should have the "Claiming to" row with account display
    expect(screen.getByText('Claiming to')).toBeInTheDocument();
  });
});
