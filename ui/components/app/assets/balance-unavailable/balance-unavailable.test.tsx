import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { retrySnapBalances } from '../../../../store/actions';
import { BalanceUnavailable } from './balance-unavailable';

jest.mock('../../../../store/actions', () => ({
  retrySnapBalances: jest.fn(),
}));

const mockStore = configureMockStore()(mockState);

describe('BalanceUnavailable', () => {
  beforeEach(() => {
    jest.mocked(retrySnapBalances).mockReset();
  });

  it('renders the unavailable text and a Retry link', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-account']} />,
      mockStore,
    );

    expect(getByText('Balance unavailable')).toBeInTheDocument();
    expect(getByTestId('balance-unavailable-retry')).toBeInTheDocument();
  });

  it('retries the given accounts when Retry is clicked', async () => {
    jest.mocked(retrySnapBalances).mockResolvedValue(undefined);
    const { getByTestId } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-1', 'btc-2']} />,
      mockStore,
    );

    fireEvent.click(getByTestId('balance-unavailable-retry'));

    await waitFor(() =>
      expect(retrySnapBalances).toHaveBeenCalledWith(['btc-1', 'btc-2']),
    );
  });

  it('ignores clicks while a retry is in flight', async () => {
    let resolveRetry: () => void = () => undefined;
    jest.mocked(retrySnapBalances).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve;
        }),
    );
    const { getByTestId } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-1']} />,
      mockStore,
    );

    fireEvent.click(getByTestId('balance-unavailable-retry'));
    fireEvent.click(getByTestId('balance-unavailable-retry'));
    expect(retrySnapBalances).toHaveBeenCalledTimes(1);

    resolveRetry();
    await waitFor(() =>
      expect(getByTestId('balance-unavailable-retry')).not.toBeDisabled(),
    );
  });

  it('does not throw when the retry fails', async () => {
    jest.mocked(retrySnapBalances).mockRejectedValue(new Error('boom'));
    const { getByTestId } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-1']} />,
      mockStore,
    );

    fireEvent.click(getByTestId('balance-unavailable-retry'));

    await waitFor(() =>
      expect(getByTestId('balance-unavailable-retry')).not.toBeDisabled(),
    );
  });

  it('can hide the text or the Retry link', () => {
    const { queryByText, rerender } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-1']} hideText />,
      mockStore,
    );
    expect(queryByText('Balance unavailable')).not.toBeInTheDocument();
    expect(queryByText('Retry')).toBeInTheDocument();

    rerender(<BalanceUnavailable accountIds={['btc-1']} hideRetry />);
    expect(queryByText('Balance unavailable')).toBeInTheDocument();
    expect(queryByText('Retry')).not.toBeInTheDocument();
  });
});
