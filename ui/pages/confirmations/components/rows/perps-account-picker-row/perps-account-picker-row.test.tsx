import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useTransactionMetadataRequestOptional } from '../../../hooks/transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import { updateEditableParams } from '../../../../../store/actions';
import {
  usePerpsSubAccounts,
  type SubAccountInfo,
} from '../../../hooks/transactions/usePerpsSubAccounts';
import {
  PERPS_ACCOUNT_BALANCE_SKELETON_TEST_ID,
  PERPS_ACCOUNT_PICKER_TEST_IDS,
  PerpsAccountPickerRow,
} from './perps-account-picker-row';

jest.mock('../../../hooks/transactions/useTransactionMetadataRequest');
jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  PayWithOption: { MoneyAccount: 'money_account' },
  useConfirmationNavigationOptions: jest.fn(),
}));
jest.mock('../../../../../store/actions', () => ({
  updateEditableParams: jest.fn(() => () => Promise.resolve()),
}));
jest.mock('../../../hooks/transactions/usePerpsSubAccounts', () => ({
  ...jest.requireActual('../../../hooks/transactions/usePerpsSubAccounts'),
  usePerpsSubAccounts: jest.fn(),
}));
jest.mock('../../../../../components/app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));
jest.mock('../../../../../../shared/lib/perps-formatters', () => ({
  formatPerpsFiat: (value: string | number) => `$${value}`,
}));

const FROM_ADDRESS_MOCK = '0xabcdef1234567890abcdef1234567890abcdef12';
const OTHER_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const CHAIN_ID_MOCK = '0x1';
const TX_ID_MOCK = 'test-id';

const MOCK_ACCOUNTS: SubAccountInfo[] = [
  {
    id: FROM_ADDRESS_MOCK,
    name: 'Account 1 (Perps)',
    spendableBalance: '100',
    withdrawableBalance: '50',
    totalBalance: '150',
  },
  {
    id: OTHER_ADDRESS_MOCK,
    name: 'Account 2 (Perps)',
    spendableBalance: '200',
    withdrawableBalance: '100',
    totalBalance: '300',
  },
];

const mockStore = configureStore([thunk]);

describe('PerpsAccountPickerRow', () => {
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const useConfirmationNavigationOptionsMock = jest.mocked(
    useConfirmationNavigationOptions,
  );
  const updateEditableParamsMock = jest.mocked(updateEditableParams);
  const usePerpsSubAccountsMock = jest.mocked(usePerpsSubAccounts);

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: PayWithOption.MoneyAccount,
    } as ReturnType<typeof useConfirmationNavigationOptions>);

    useTransactionMetadataRequestOptionalMock.mockReturnValue({
      id: TX_ID_MOCK,
      chainId: CHAIN_ID_MOCK,
      type: TransactionType.perpsDeposit,
      txParams: { from: FROM_ADDRESS_MOCK },
    } as never);

    usePerpsSubAccountsMock.mockReturnValue({
      subAccounts: MOCK_ACCOUNTS,
      selectedSubAccount: MOCK_ACCOUNTS[0],
    });

    updateEditableParamsMock.mockReturnValue((() =>
      Promise.resolve()) as never);
  });

  it('renders when perps deposit with MoneyAccount option', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.row),
    ).toBeInTheDocument();
  });

  it('renders nothing when payWithOption is not MoneyAccount', () => {
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: undefined,
    } as ReturnType<typeof useConfirmationNavigationOptions>);

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.row),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the confirmation is not a perps deposit', () => {
    useTransactionMetadataRequestOptionalMock.mockReturnValue({
      id: TX_ID_MOCK,
      type: TransactionType.simpleSend,
      txParams: { from: FROM_ADDRESS_MOCK },
    } as never);

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.row),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when no sub-accounts are available', () => {
    usePerpsSubAccountsMock.mockReturnValue({
      subAccounts: [],
      selectedSubAccount: null,
    });

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.row),
    ).not.toBeInTheDocument();
  });

  it('displays the selected account name', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.name),
    ).toHaveTextContent('Account 1 (Perps)');
  });

  it('displays perps balances in the picker', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));

    expect(screen.getByText('$150')).toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();
  });

  it('displays a skeleton while a perps balance is still loading', () => {
    usePerpsSubAccountsMock.mockReturnValue({
      subAccounts: [
        {
          ...MOCK_ACCOUNTS[0],
          spendableBalance: '',
          withdrawableBalance: '',
          totalBalance: '',
        },
        MOCK_ACCOUNTS[1],
      ],
      selectedSubAccount: MOCK_ACCOUNTS[0],
    });

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));

    expect(
      screen.getByTestId(PERPS_ACCOUNT_BALANCE_SKELETON_TEST_ID),
    ).toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();
  });

  it('displays a skeleton for HyperLiquid sentinel totals instead of $0', () => {
    usePerpsSubAccountsMock.mockReturnValue({
      subAccounts: [
        {
          ...MOCK_ACCOUNTS[0],
          spendableBalance: '--',
          withdrawableBalance: '--',
          totalBalance: '--',
        },
        MOCK_ACCOUNTS[1],
      ],
      selectedSubAccount: MOCK_ACCOUNTS[0],
    });

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));

    expect(
      screen.getByTestId(PERPS_ACCOUNT_BALANCE_SKELETON_TEST_ID),
    ).toBeInTheDocument();
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();
  });

  it('opens the picker on row press', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.sheet),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));

    expect(
      screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.sheet),
    ).toBeInTheDocument();
  });

  it('updates the transaction from address on account selection', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));
    fireEvent.click(
      screen.getByTestId(
        `${PERPS_ACCOUNT_PICKER_TEST_IDS.accountItem}-${OTHER_ADDRESS_MOCK}`,
      ),
    );

    expect(updateEditableParamsMock).toHaveBeenCalledWith(TX_ID_MOCK, {
      from: OTHER_ADDRESS_MOCK,
    });
  });

  it('does not update the transaction when it has no id', () => {
    useTransactionMetadataRequestOptionalMock.mockReturnValue({
      type: TransactionType.perpsDeposit,
      txParams: { from: FROM_ADDRESS_MOCK },
    } as never);

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId(PERPS_ACCOUNT_PICKER_TEST_IDS.pill));
    fireEvent.click(
      screen.getByTestId(
        `${PERPS_ACCOUNT_PICKER_TEST_IDS.accountItem}-${OTHER_ADDRESS_MOCK}`,
      ),
    );

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });
});
