import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import Success from './success';

describe('Success', () => {
  it('renders the title and description', () => {
    renderWithLocalization(<Success onDone={jest.fn()} />);

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '5 accounts from 2 Secret Recovery Phrases were synced to your phone.',
      ),
    ).toBeInTheDocument();
  });

  it('renders singular copy when one account from one SRP is synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} accountCount={1} srpCount={1} />,
    );

    expect(
      screen.getByText(
        '1 account from 1 Secret Recovery Phrase was synced to your phone.',
      ),
    ).toBeInTheDocument();
  });

  it('renders singular SRP copy when multiple accounts from one SRP are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} accountCount={3} srpCount={1} />,
    );

    expect(
      screen.getByText(
        '3 accounts from 1 Secret Recovery Phrase were synced to your phone.',
      ),
    ).toBeInTheDocument();
  });

  it('calls onDone when the done button is clicked', () => {
    const onDone = jest.fn();
    renderWithLocalization(<Success onDone={onDone} />);

    fireEvent.click(screen.getByText(messages.done.message));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
