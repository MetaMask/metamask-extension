import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import TransactionFailed from '.';

const mockErrorMessage = 'Something went wrong';

const props = {
  hideModal: jest.fn(),
  closeNotification: false,
  operationFailed: false,
  errorMessage: mockErrorMessage,
};

describe('Transaction Failed', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const initialState = {
    ...testData,
  };

  const store = mockStore(initialState);

  it('renders the error message', () => {
    renderWithProvider(<TransactionFailed {...props} />, store);
    const errorMessageElement = screen.getByText(mockErrorMessage);
    expect(errorMessageElement).toBeInTheDocument();
  });

  it('renders the correct title when operation fails', () => {
    const customProps = { ...props, operationFailed: true };
    renderWithProvider(<TransactionFailed {...customProps} />, store);
    const titleElement = screen.getByText('Operation Failed!');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the correct title when transaction fails', () => {
    const customProps = { ...props, operationFailed: false };
    renderWithProvider(<TransactionFailed {...customProps} />, store);
    const titleElement = screen.getByText('Transaction Failed!');
    expect(titleElement).toBeInTheDocument();
  });

  it('closes window when closeNotification is true', () => {
    global.platform = {
      closeCurrentWindow: jest.fn(),
      openTab: jest.fn(),
    };
    const customProps = { ...props, closeNotification: true };
    renderWithProvider(<TransactionFailed {...customProps} />, store);
    const okButton = screen.getByText('Ok');
    fireEvent.click(okButton);
    expect(global.platform.closeCurrentWindow).toHaveBeenCalledTimes(1);
  });
});
