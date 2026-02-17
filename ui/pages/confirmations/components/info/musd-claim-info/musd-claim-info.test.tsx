import React from 'react';
import { act } from '@testing-library/react';
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

jest.mock('../../../../../components/app/musd/merkl-client', () => ({
  getClaimedAmountFromContract: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../hooks/tokens/useTokenFiatRates', () => ({
  useTokenFiatRate: () => 1.0,
  useTokenFiatRates: () => [1.0],
}));

const buildMusdClaimTransaction = (): TransactionMeta =>
  ({
    actionId: String(400855682),
    chainId: '0xe708', // Linea
    id: 'musd-claim-tx-id',
    status: TransactionStatus.unapproved,
    type: TransactionType.musdClaim,
    time: Date.now(),
    txParams: {
      from: MOCK_ADDRESS,
      to: MERKL_DISTRIBUTOR_ADDRESS,
      value: '0x0',
      data: encodeClaimData('10500000'),
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
  }) as unknown as TransactionMeta;

describe('MusdClaimInfo', () => {
  it('renders the musd claim heading, details section, and gas fees', async () => {
    const transaction = buildMusdClaimTransaction();
    const state = getMockConfirmState({
      metamask: {
        pendingApprovals: {
          [transaction.id]: {
            id: transaction.id,
            type: ApprovalType.Transaction,
          },
        },
        transactions: [transaction],
      },
    });
    const mockStore = configureMockStore()(state);

    let result: ReturnType<typeof renderWithConfirmContextProvider>;
    await act(async () => {
      result = renderWithConfirmContextProvider(<MusdClaimInfo />, mockStore);

      // Hero heading is rendered
      expect(result.getByTestId('musd-claim-heading')).toBeDefined();

      // Details section is rendered
      expect(result.getByTestId('musd-claim-details-section')).toBeDefined();

      // Gas fee section is rendered
      expect(result.getByTestId('gas-fee-section')).toBeDefined();
    });
  });
});
