import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/jest';
import { Footer } from '.';

const render = () => {
  return renderWithProvider(
    <Footer />,
    configureMockStore([])({
      confirm: {
        currentConfirmation: {
          type: TransactionType.personalSign,
          isScrollToBottomNeeded: false,
        },
      },
    }),
  );
};

describe('ConfirmFooter', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders the "Cancel" and "Confirm" Buttons', () => {
    const { getAllByRole, getByText } = render();
    const buttons = getAllByRole('button');
    expect(buttons[0]).toBeInTheDocument();
    expect(buttons[1]).toBeInTheDocument();
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });
});
