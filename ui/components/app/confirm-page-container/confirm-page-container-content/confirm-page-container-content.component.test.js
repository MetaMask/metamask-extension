import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '../../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  TRANSACTION_ERROR_KEY,
} from '../../../../helpers/constants/error-keys';
import ConfirmPageContainerContent from './confirm-page-container-content.component';

describe('Confirm Page Container Content', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: '0x5',
      },
      addressBook: {
        '0x5': {
          '0x06195827297c7A80a443b6894d3BDB8824b43896': {
            address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
            name: 'Address Book Account 1',
            chainId: '0x5',
          },
        },
      },
    },
  };

  const store = configureMockStore()(mockStore);

  let props = {};

  beforeEach(() => {
    const mockOnCancel = jest.fn();
    const mockOnCancelAll = jest.fn();
    const mockOnSubmit = jest.fn();
    const mockSetUserAcknowledgedGasMissing = jest.fn();
    props = {
      action: ' Withdraw Stake',
      errorMessage: null,
      errorKey: null,
      onCancelAll: mockOnCancelAll,
      onCancel: mockOnCancel,
      cancelText: 'Reject',
      onSubmit: mockOnSubmit,
      setUserAcknowledgedGasMissing: mockSetUserAcknowledgedGasMissing,
      submitText: 'Confirm',
      disabled: true,
      origin: 'http://localhost:4200',
      hideTitle: false,
    };
  });

  it('render ConfirmPageContainer component with another error', async () => {
    props.disabled = true;
    props.errorKey = TRANSACTION_ERROR_KEY;
    props.currentTransaction = {
      type: 'transfer',
    };
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
    expect(getByText('Confirm').closest('button')).toBeDisabled();
    expect(
      getByText('Transaction error. Exception thrown in contract code.'),
    ).toBeInTheDocument();

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render ConfirmPageContainer component with no errors', async () => {
    props.disabled = false;
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Transaction error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();

    const confirmButton = getByText('Confirm');
    fireEvent.click(confirmButton);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render contract address name from addressBook in title for contract', async () => {
    props.disabled = false;
    props.toAddress = '0x06195827297c7A80a443b6894d3BDB8824b43896';
    props.transactionType = TransactionType.contractInteraction;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).toBeInTheDocument();
  });

  it('render simple title without address name for simple send', async () => {
    props.disabled = false;
    props.toAddress = '0x06195827297c7A80a443b6894d3BDB8824b43896';
    props.transactionType = TransactionType.simpleSend;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).not.toBeInTheDocument();
  });

  it('should show insufficient funds error for EIP-1559 network', () => {
    const { getByRole } = renderWithProvider(
      <ConfirmPageContainerContent
        {...props}
        errorKey={INSUFFICIENT_FUNDS_ERROR_KEY}
        isBuyableChain
        supportsEIP1559
      />,
      store,
    );
    expect(getByRole('button', { name: 'Buy' })).toBeInTheDocument();
  });

  it('should show insufficient funds error for legacy network', () => {
    const { getByRole } = renderWithProvider(
      <ConfirmPageContainerContent
        {...props}
        errorKey={INSUFFICIENT_FUNDS_ERROR_KEY}
        isBuyableChain
        supportsEIP1559={false}
      />,
      store,
    );
    expect(getByRole('button', { name: 'Buy' })).toBeInTheDocument();
  });
});
