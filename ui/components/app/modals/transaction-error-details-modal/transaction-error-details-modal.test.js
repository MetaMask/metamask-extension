import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import TransactionErrorDetailsModal from './transaction-error-details';

const mockHandleCopy = jest.fn();
jest.mock('../../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [true, mockHandleCopy],
}));

describe('Transaction Error Details Modal', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
    copied: false,
  };

  // needed for clipboard
  jest.spyOn(window, 'prompt').mockImplementation();

  const store = configureMockStore()(mockStore);
  const props = {
    network: 'test',
    closePopover: jest.fn(),
    message: `[ethjs-query] while formatting outputs from RPC '{"value":{"code":-32000,"message":"intrinsic gas too low"}}'`,
  };

  it('shows transaction error details alert', async () => {
    renderWithProvider(<TransactionErrorDetailsModal {...props} />, store);

    const heading = screen.getByRole('heading', { name: 'Details' });
    expect(heading.title).toStrictEqual('Details');

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton.title).toStrictEqual('Close');
    fireEvent.click(closeButton);
    expect(props.closePopover).toHaveBeenCalledTimes(1);

    const copyToClipboard = screen.getByRole('button', {
      name: 'Copy to clipboard',
    });
    fireEvent.click(copyToClipboard);
    expect(mockHandleCopy).toHaveBeenCalledTimes(1);

    const message = screen.getByText(/^\[ethjs-query\]/u);
    expect(message).toBeInTheDocument();
  });
});
