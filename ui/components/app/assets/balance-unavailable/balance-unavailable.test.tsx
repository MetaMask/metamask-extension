import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
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

  it('renders the unavailable text in a status region and a Retry link', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-account']} />,
      mockStore,
    );

    const status = getByText(messages.balanceUnavailable.message);
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-live', 'polite');
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

  it('ignores clicks while a retry is in flight without disabling the control', async () => {
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

    const retry = getByTestId('balance-unavailable-retry');
    retry.focus();
    fireEvent.click(retry);
    fireEvent.click(retry);

    expect(retrySnapBalances).toHaveBeenCalledTimes(1);
    expect(retry).toHaveAttribute('aria-busy', 'true');
    expect(retry).toHaveAttribute('aria-disabled', 'true');
    expect(retry).not.toBeDisabled();
    expect(document.activeElement).toBe(retry);

    resolveRetry();
    await waitFor(() =>
      expect(getByTestId('balance-unavailable-retry')).not.toHaveAttribute(
        'aria-busy',
      ),
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
      expect(getByTestId('balance-unavailable-retry')).not.toHaveAttribute(
        'aria-busy',
      ),
    );
  });

  it('exposes an accessible Retry name and network description', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <BalanceUnavailable
        accountIds={['btc-1']}
        hideText
        retryContextLabel="BTC"
        networkNames={['Bitcoin']}
      />,
      mockStore,
    );

    expect(getByTestId('balance-unavailable-retry')).toHaveAttribute(
      'aria-label',
      messages.retryBalanceFor.message.replace('$1', 'BTC'),
    );
    expect(
      getByText(
        messages.balanceUnavailableDescription.message.replace('$1', 'Bitcoin'),
      ),
    ).toHaveClass('sr-only');
  });

  it('can hide the text or the Retry link', () => {
    const { queryByText, rerender } = renderWithProvider(
      <BalanceUnavailable accountIds={['btc-1']} hideText />,
      mockStore,
    );
    expect(
      queryByText(messages.balanceUnavailable.message),
    ).not.toBeInTheDocument();
    expect(
      queryByText(messages.balanceUnavailableRetry.message),
    ).toBeInTheDocument();

    rerender(<BalanceUnavailable accountIds={['btc-1']} hideRetry />);
    expect(
      queryByText(messages.balanceUnavailable.message),
    ).toBeInTheDocument();
    expect(
      queryByText(messages.balanceUnavailableRetry.message),
    ).not.toBeInTheDocument();
  });
});
