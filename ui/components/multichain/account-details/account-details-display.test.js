import React from 'react';
import { act } from '@testing-library/react';
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { AccountDetailsDisplay } from './account-details-display';

jest.mock('../../../pages/confirmations/hooks/useEIP7702Account', () => ({
  useEIP7702Account: jest.fn(),
}));

const ADDRESS_MOCK = Object.values(
  mockState.metamask.internalAccounts.accounts,
)[0].address;

function renderComponent() {
  return renderWithProvider(
    <AccountDetailsDisplay accounts={[]} address={ADDRESS_MOCK} />,
    configureStore(mockState),
  );
}

describe('AccountDetailsDisplay', () => {
  const useEIP7702AccountMock = jest.mocked(useEIP7702Account);
  const isUpgradedMock = jest.fn();
  const downgradeAccountMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    useEIP7702AccountMock.mockReturnValue({
      isUpgraded: isUpgradedMock,
      downgradeAccount: downgradeAccountMock,
    });
  });

  it('renders smart account pill if account is upgraded', async () => {
    isUpgradedMock.mockResolvedValue(true);
    const { getByText } = renderComponent();

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('Smart account')).toBeInTheDocument();
  });

  it('does not render smart account pill if account is not upgraded', async () => {
    isUpgradedMock.mockResolvedValue(false);
    const { queryByText } = renderComponent();

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByText('Smart account')).toBeNull();
  });

  it('renders downgrade button if account is upgraded', async () => {
    isUpgradedMock.mockResolvedValue(true);
    const { getByText } = renderComponent();

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('Switch back to regular account')).toBeInTheDocument();
  });

  it('does not render downgrade button if account is not upgraded', async () => {
    isUpgradedMock.mockResolvedValue(false);
    const { queryByText } = renderComponent();

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByText('Switch back to regular account')).toBeNull();
  });

  it('adds transaction on downgrade button click', async () => {
    isUpgradedMock.mockResolvedValue(true);
    const { queryByText } = renderComponent();

    await act(async () => {
      // Intentionally empty
    });

    await act(async () => {
      queryByText('Switch back to regular account').click();
    });

    expect(downgradeAccountMock).toHaveBeenCalledTimes(1);
    expect(downgradeAccountMock).toHaveBeenCalledWith(ADDRESS_MOCK);
  });
});
