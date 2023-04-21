import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import TransactionFailed from '.';

const mockErrorMessage = 'Something went wrong';

describe('Transaction Failed', () => {
  const mockStore = {
    ...testData,
  };

  const store = configureMockStore()(mockStore);

  it('renders the error message', () => {
    renderWithProvider(
      <TransactionFailed errorMessage={mockErrorMessage} />,
      store,
    );
    const errorMessageElement = screen.getByText(mockErrorMessage);
    expect(errorMessageElement).toBeInTheDocument();
  });

  it('renders the correct title when operation fails', () => {
    const operationFailed = true;
    const title = 'Operation Failed!';
    renderWithProvider(
      <TransactionFailed
        operationFailed={operationFailed}
        errorMessage={mockErrorMessage}
      />,
      store,
    );
    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the correct title when transaction fails', () => {
    const operationFailed = false;
    const title = 'Transaction Failed!';
    renderWithProvider(
      <TransactionFailed
        operationFailed={operationFailed}
        errorMessage={mockErrorMessage}
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
