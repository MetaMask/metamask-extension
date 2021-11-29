import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { TRANSACTION_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import ConfirmPageContainerContent from './confirm-page-container-content.component';

describe('Confirm Page Container Content', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
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
      hasSimulationError: true,
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

  it('render ConfirmPageContainer component with simulation error', async () => {
    process.env.EIP_1559_V2 = false;

    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText('Transaction Error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(
      queryByText(
        'This transaction is expected to fail. Trying to execute it is expected to be expensive but fail, and is not recommended.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I will try anyway')).toBeInTheDocument();

    const confirmButton = getByText('Confirm');
    expect(getByText('Confirm').closest('button')).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(props.onSubmit).toHaveBeenCalledTimes(0);

    const iWillTryButton = getByText('I will try anyway');
    fireEvent.click(iWillTryButton);
    expect(props.setUserAcknowledgedGasMissing).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render ConfirmPageContainer component with another error', async () => {
    props.hasSimulationError = false;
    props.disabled = true;
    props.errorKey = TRANSACTION_ERROR_KEY;
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'This transaction is expected to fail. Trying to execute it is expected to be expensive but fail, and is not recommended.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I will try anyway')).not.toBeInTheDocument();
    expect(getByText('Confirm').closest('button')).toBeDisabled();
    expect(
      getByText('Transaction Error. Exception thrown in contract code.'),
    ).toBeInTheDocument();

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render ConfirmPageContainer component with no errors', async () => {
    props.hasSimulationError = false;
    props.disabled = false;
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'This transaction is expected to fail. Trying to execute it is expected to be expensive but fail, and is not recommended.',
      ),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Transaction Error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(queryByText('I will try anyway')).not.toBeInTheDocument();

    const confirmButton = getByText('Confirm');
    fireEvent.click(confirmButton);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
