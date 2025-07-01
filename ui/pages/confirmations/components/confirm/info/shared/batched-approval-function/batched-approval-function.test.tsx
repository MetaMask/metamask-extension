import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import {
  BatchTransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act, waitFor } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { buildPermit2ApproveTransactionData } from '../../../../../../../../test/data/confirmations/token-approve';
import { buildSetApproveForAllTransactionData } from '../../../../../../../../test/data/confirmations/set-approval-for-all';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { DecodedTransactionDataMethod } from '../../../../../../../../shared/types/transaction-decode';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';
import { Confirmation } from '../../../../../types/confirm';
import { BatchedApprovalFunction } from './batched-approval-function';

const DATA_MOCK = '0x123456';
const TO_MOCK = '0x1234';
const ADDRESS_MOCK = '0x1234567890123456789012345678901234567890';
const ADDRESS_2_MOCK = '0x1234567890123456789012345678901234567891';
const EXPIRATION_MOCK = 1234567890;
const AMOUNT_MOCK = 123;

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getTokenStandardAndDetails: jest.fn(),
}));

async function renderTransactionData({
  nestedTransactions,
}: {
  currentData: string;
  dataOverride?: Hex;
  nestedTransactions?: BatchTransactionParams[];
  toOverride?: Hex;
  nestedTransactionIndex?: number;
}) {
  const state = getMockConfirmStateForTransaction({
    id: '123',
    chainId: '0x5',
    type: TransactionType.contractInteraction,
    status: TransactionStatus.unapproved,
    nestedTransactions,
    txParams: {
      to: TO_MOCK,
      data: DATA_MOCK,
    },
  } as Confirmation);

  const mockStore = configureMockStore()(state);

  const result = renderWithConfirmContextProvider(
    <BatchedApprovalFunction
      method={{ name: 'approve' } as DecodedTransactionDataMethod}
      nestedTransactionIndex={0}
    />,
    mockStore,
  );

  await act(() => {
    // Ignore
  });

  return result;
}

describe('BatchedApprovalFunction', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders ERC20 approvals correctly', async () => {
    (getTokenStandardAndDetails as jest.Mock).mockResolvedValue({
      decimals: 6,
      symbol: 'ETH',
      standard: 'ERC20',
      amountOrTokenId: '10000000',
    });

    const { getByText } = await renderTransactionData({
      currentData: '0x123',
      dataOverride:
        '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
      nestedTransactions: [
        {
          data: '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
          to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
      ],
      nestedTransactionIndex: 0,
    });

    await waitFor(() => {
      expect(getByText('approve')).toBeInTheDocument();
      expect(getByText('Spender')).toBeInTheDocument();
      expect(getByText('0x1231D...F4EaE')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('10000000 ETH')).toBeInTheDocument();
    });
  });

  it('renders ERC20 permit-2 approvals correctly', async () => {
    (getTokenStandardAndDetails as jest.Mock).mockResolvedValue({
      decimals: 6,
      symbol: 'ETH',
      standard: 'ERC20',
      amountOrTokenId: '10000000',
    });

    const { getByText } = await renderTransactionData({
      currentData: '0x123',
      dataOverride:
        '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
      nestedTransactions: [
        {
          data: buildPermit2ApproveTransactionData(
            ADDRESS_MOCK,
            ADDRESS_2_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
          to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
      ],
      nestedTransactionIndex: 0,
    });

    await waitFor(() => {
      expect(getByText('approve')).toBeInTheDocument();
      expect(getByText('Spender')).toBeInTheDocument();
      expect(getByText('0x12345...67891')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('0.000123 ETH')).toBeInTheDocument();
    });
  });

  it('renders setApprovalForAll correctly', async () => {
    (getTokenStandardAndDetails as jest.Mock).mockResolvedValue({
      decimals: 6,
      symbol: 'ETH',
      standard: 'ERC20',
      amountOrTokenId: '10000000',
    });

    const { getByText } = await renderTransactionData({
      currentData: '0x123',
      dataOverride:
        '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
      nestedTransactions: [
        {
          data: buildSetApproveForAllTransactionData(ADDRESS_MOCK, true),
          to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
      ],
      nestedTransactionIndex: 0,
    });

    await waitFor(() => {
      expect(getByText('approve')).toBeInTheDocument();
      expect(getByText('Spender')).toBeInTheDocument();
      expect(getByText('0x12345...67890')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('All')).toBeInTheDocument();
    });
  });
});
