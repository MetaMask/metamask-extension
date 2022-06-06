import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TRANSACTION_TYPES } from '../../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { TRANSACTION_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import ConfirmPageContainerContent from './confirm-page-container-content.component';

describe('Confirm Page Container Content', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
        chainId: '0x3',
      },
      eip1559V2Enabled: false,
      addressBook: {
        '0x3': {
          '0x06195827297c7A80a443b6894d3BDB8824b43896': {
            address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
            name: 'Address Book Account 1',
            chainId: '0x3',
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
      getByText('Transaction Error. Exception thrown in contract code.'),
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
      queryByText('Transaction Error. Exception thrown in contract code.'),
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
    props.transactionType = TRANSACTION_TYPES.CONTRACT_INTERACTION;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).toBeInTheDocument();
  });

  it('render simple title without address name for simple send', async () => {
    props.disabled = false;
    props.toAddress = '0x06195827297c7A80a443b6894d3BDB8824b43896';
    props.transactionType = TRANSACTION_TYPES.SIMPLE_SEND;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).not.toBeInTheDocument();
  });
});
