import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import RejectTransactionsModal from '.';

describe('Reject Transactions Model', () => {
  const props = {
    onSubmit: jest.fn(),
    hideModal: jest.fn(),
    unapprovedTxCount: 2,
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <RejectTransactionsModal.WrappedComponent {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('hides modal when cancel button is clicked', () => {
    const { queryByText } = renderWithProvider(
      <RejectTransactionsModal.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[cancel]'));

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('onSubmit is called and hides modal when reject all clicked', async () => {
    const { queryByText } = renderWithProvider(
      <RejectTransactionsModal.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[rejectAll]'));

    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalled();
      expect(props.hideModal).toHaveBeenCalled();
    });
  });
});
