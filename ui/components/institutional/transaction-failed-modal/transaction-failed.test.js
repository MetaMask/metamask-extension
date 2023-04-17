import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import TransactionFailed from '.';

describe('Transaction Failed', () => {
  const mockStore = {
    ...testData,
  };

  const store = configureMockStore()(mockStore);

  it('renders the error message', () => {
    const errorMessage = 'Something went wrong';
    renderWithProvider(
      <TransactionFailed errorMessage={errorMessage} />,
      store,
    );
    const errorMessageElement = screen.getByText(errorMessage);
    expect(errorMessageElement).toBeInTheDocument();
  });

  it('renders the correct title when operation fails', () => {
    const operationFailed = true;
    const errorMessage = 'Something went wrong';
    const title = 'Operation Failed!';
    renderWithProvider(
      <TransactionFailed
        operationFailed={operationFailed}
        errorMessage={errorMessage}
      />,
      store,
    );
    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the correct title when transaction fails', () => {
    const operationFailed = false;
    const errorMessage = 'Something went wrong';
    const title = 'Transaction Failed!';
    renderWithProvider(
      <TransactionFailed
        operationFailed={operationFailed}
        errorMessage={errorMessage}
      />,
      store,
    );
    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
  });

  it('closes window when closeNotification is true', () => {
    global.platform = {
      closeCurrentWindow: jest.fn(),
    };
    renderWithProvider(<TransactionFailed closeNotification />, store);
    const okButton = screen.getByText('Ok');
    fireEvent.click(okButton);
    expect(global.platform.closeCurrentWindow).toHaveBeenCalledTimes(1);
  });
});
