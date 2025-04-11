import { fireEvent } from '@testing-library/react';
import React from 'react';

import TransactionConfirmed from '.';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

describe('Transaction Confirmed', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <TransactionConfirmed.WrappedComponent />,
    );

    expect(container).toMatchSnapshot();
  });

  it('clicks ok to submit and hide modal', () => {
    const props = {
      onSubmit: jest.fn(),
      hideModal: jest.fn(),
    };

    const { queryByText } = renderWithProvider(
      <TransactionConfirmed.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[ok]'));

    expect(props.onSubmit).toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });
});
