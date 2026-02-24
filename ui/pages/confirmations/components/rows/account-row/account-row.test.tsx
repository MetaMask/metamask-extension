import React from 'react';
import { act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { AccountRow } from './account-row';

const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

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

const buildTransaction = (): TransactionMeta =>
  ({
    actionId: String(400855682),
    chainId: '0xe708',
    id: 'account-row-tx-id',
    status: TransactionStatus.unapproved,
    type: TransactionType.simpleSend,
    time: Date.now(),
    txParams: {
      from: MOCK_ADDRESS,
      to: '0x1234567890abcdef1234567890abcdef12345678',
      value: '0x0',
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

describe('AccountRow', () => {
  it('renders the label and address', async () => {
    const transaction = buildTransaction();
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
      result = renderWithConfirmContextProvider(
        <AccountRow label="Claiming to" />,
        mockStore,
      );
      expect(result.getByText('Claiming to')).toBeDefined();
      expect(result.container.querySelector('.confirm-info-row')).toBeDefined();
    });
  });

  it('renders with a custom label', async () => {
    const transaction = buildTransaction();
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
      result = renderWithConfirmContextProvider(
        <AccountRow label="Sending from" />,
        mockStore,
      );
      expect(result.getByText('Sending from')).toBeDefined();
    });
  });
});
