import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import Success from './success';

describe('Success', () => {
  it('renders the title and synced counts from props', () => {
    renderWithLocalization(
      <Success
        syncedAccountCount={3}
        syncedWalletCount={2}
        onDone={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '3 accounts from 2 Secret Recovery Phrases were synced to your phone.',
      ),
    ).toBeInTheDocument();
  });

  it('calls onDone when the done button is clicked', () => {
    const onDone = jest.fn();
    renderWithLocalization(
      <Success
        syncedAccountCount={1}
        syncedWalletCount={1}
        onDone={onDone}
      />,
    );

    fireEvent.click(screen.getByText(messages.done.message));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
