import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { tick } from '../../../../../test/lib/tick';
import { TRANSACTION_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import ConfirmPageContainerContent from './confirm-page-container-content.component';

describe('Confirm Page Container Page', () => {
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
    props = {
      action: ' Withdraw Stake',
      errorMessage: null,
      errorKey: null,
      hasSimulationError: true,
      onCancelAll: mockOnCancelAll,
      onCancel: mockOnCancel,
      cancelText: 'Reject',
      onSubmit: mockOnSubmit,
      submitText: 'Confirm',
      disabled: true,
      origin: 'http://localhost:4200',
    };
  });

  it('render ConfirmPageContainer component with simulation error', async () => {
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText('Transaction Error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I will try anyway')).toBeInTheDocument();

    expect(getByText('Confirm').closest('button')).toBeDisabled();
    const iWillTryButton = getByText('I will try anyway');
    fireEvent.click(iWillTryButton);
    await tick();
    expect(getByText('Confirm').closest('button')).toBeEnabled();

    const confirmButton = getByText('Confirm');
    fireEvent.click(confirmButton);
    await tick();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    await tick();
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
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I will try anyway')).not.toBeInTheDocument();
    expect(getByText('Confirm').closest('button')).toBeDisabled();
    expect(
      getByText('Transaction Error. Exception thrown in contract code.'),
    ).toBeInTheDocument();

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    await tick();
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
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Transaction Error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(queryByText('I will try anyway')).not.toBeInTheDocument();
    expect(getByText('Confirm').closest('button')).toBeEnabled();

    const confirmButton = getByText('Confirm');
    fireEvent.click(confirmButton);
    await tick();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    await tick();
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
