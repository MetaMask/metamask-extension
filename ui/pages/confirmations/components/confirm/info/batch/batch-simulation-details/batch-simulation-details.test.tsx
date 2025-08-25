import React from 'react';
import { BigNumber } from 'bignumber.js';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import {
  ApprovalBalanceChange,
  useBatchApproveBalanceChanges,
} from '../../hooks/useBatchApproveBalanceChanges';
import { AlertMetricsProvider } from '../../../../../../../components/app/alert-system/contexts/alertMetricsContext';
import { useBalanceChanges } from '../../../../simulation-details/useBalanceChanges';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import { buildApproveTransactionData } from '../../../../../../../../test/data/confirmations/token-approve';
import {
  downgradeAccountConfirmation,
  upgradeAccountConfirmationOnly,
} from '../../../../../../../../test/data/confirmations/batch-transaction';
import { updateAtomicBatchData } from '../../../../../../../store/controller-actions/transaction-controller';
import { Confirmation } from '../../../../../types/confirm';
import { updateApprovalAmount } from '../../../../../../../../shared/lib/transactions/approvals';
import { BatchSimulationDetails } from './batch-simulation-details';

jest.mock('../../../../../../../../shared/lib/transactions/approvals');

jest.mock('../../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(),
}));

jest.mock('../../hooks/useBatchApproveBalanceChanges', () => ({
  useBatchApproveBalanceChanges: jest.fn(),
}));

jest.mock(
  '../../../../../../../store/controller-actions/transaction-controller',
  () => ({
    updateAtomicBatchData: jest.fn(),
  }),
);

const ADDRESS_MOCK = '0x1234567891234567891234567891234567891234';
const ADDRESS_SHORT_MOCK = '0x12345...91234';
const DATA_MOCK = '0x12345678';

const NESTED_TRANSACTION_MOCK: BatchTransactionParams = {
  data: buildApproveTransactionData(ADDRESS_MOCK, 123),
  to: ADDRESS_MOCK,
};

const BALANCE_CHANGE_ERC20_MOCK: ApprovalBalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC20,
  },
  amount: new BigNumber(123.56),
  fiatAmount: null,
  isApproval: true,
  isAllApproval: false,
  isUnlimitedApproval: false,
  nestedTransactionIndex: 0,
  usdAmount: null,
};

const BALANCE_CHANGE_ERC721_MOCK: ApprovalBalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC721,
    tokenId: '0x141',
  },
  amount: new BigNumber(1),
  fiatAmount: null,
  isApproval: true,
  isAllApproval: false,
  isUnlimitedApproval: false,
  nestedTransactionIndex: 0,
  usdAmount: null,
};

const BALANCE_CHANGE_ERC1155_MOCK: ApprovalBalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC1155,
    tokenId: '0x141',
  },
  amount: new BigNumber(123),
  fiatAmount: null,
  isApproval: true,
  isAllApproval: false,
  isUnlimitedApproval: false,
  nestedTransactionIndex: 0,
  usdAmount: null,
};

function render(transaction?: Confirmation) {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      transaction ??
        genUnapprovedContractInteractionConfirmation({
          nestedTransactions: [NESTED_TRANSACTION_MOCK],
          simulationData: {
            tokenBalanceChanges: [],
          },
        }),
    ),
  );

  return renderWithConfirmContextProvider(
    <AlertMetricsProvider metrics={{} as never}>
      <BatchSimulationDetails />
    </AlertMetricsProvider>,
    store,
  );
}

describe('BatchSimulationDetails', () => {
  const useBalanceChangesMock = jest.mocked(useBalanceChanges);
  const updateAtomicBatchDataMock = jest.mocked(updateAtomicBatchData);
  const updateApprovalAmountMock = jest.mocked(updateApprovalAmount);

  const useBatchApproveBalanceChangesMock = jest.mocked(
    useBatchApproveBalanceChanges,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [],
    });

    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [],
    });
  });

  it('renders ERC-20 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC20_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('123.6')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders unlimited ERC-20 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [{ ...BALANCE_CHANGE_ERC20_MOCK, isUnlimitedApproval: true }],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('Unlimited')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders ERC-721 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC721_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('#321')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders all ERC-721 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [
        {
          ...BALANCE_CHANGE_ERC721_MOCK,
          asset: {
            ...BALANCE_CHANGE_ERC721_MOCK.asset,
            tokenId: undefined,
          },
          isAllApproval: true,
        },
      ],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('All')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders ERC-1155 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC1155_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('123 #321')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders all ERC-1155 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [
        {
          ...BALANCE_CHANGE_ERC1155_MOCK,
          asset: {
            ...BALANCE_CHANGE_ERC1155_MOCK.asset,
            tokenId: undefined,
          },
          isAllApproval: true,
        },
      ],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('All')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders multiple approve rows', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC20_MOCK, BALANCE_CHANGE_ERC721_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('123.6')).toBeInTheDocument();
    expect(getByText('#321')).toBeInTheDocument();
  });

  it('does not render approve row if no approve balance changes', () => {
    const { queryByText } = render();
    expect(queryByText('You approve')).toBeNull();
  });

  it('shows edit modal on edit click', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC20_MOCK],
    });

    const { getByTestId, getByText } = render();

    getByTestId('balance-change-edit').click();

    expect(getByText('Edit spending cap')).toBeInTheDocument();
  });

  it('updates nested transaction data on modal submit', async () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC20_MOCK],
    });

    updateApprovalAmountMock.mockReturnValue(DATA_MOCK);

    const { getByTestId, getByText } = render();

    await act(async () => {
      getByTestId('balance-change-edit').click();
    });

    await act(async () => {
      getByText('Save').click();
    });

    expect(updateAtomicBatchDataMock).toHaveBeenCalledTimes(1);
    expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
      transactionId: expect.any(String),
      transactionData: DATA_MOCK,
      transactionIndex: 0,
    });
  });

  it('return null for transaction of type revokeDelegation', () => {
    const { container } = render(downgradeAccountConfirmation);
    expect(container.firstChild).toBeNull();
  });

  it('return null for upgrade transaction if there are no nested transactions', () => {
    const { container } = render(upgradeAccountConfirmationOnly);
    expect(container.firstChild).toBeNull();
  });
});
