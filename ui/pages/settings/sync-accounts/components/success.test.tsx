import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import Success from './success';

jest.mock('./success-check-animation', () => () => (
  <div data-testid="qr-sync-success-check-animation">Animated check</div>
));

describe('Success', () => {
  it('renders the title, imported account count, and animated check', () => {
    renderWithLocalization(
      <Success
        onDone={jest.fn()}
        syncedWalletCount={2}
        syncedPrivateKeyAccountCount={0}
        totalSelectedAccountCount={18}
      />,
    );

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText('18 accounts imported to MetaMask mobile'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('qr-sync-success-check-animation'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.add_device_success_title.message).parentElement,
    ).toHaveClass('min-h-[88px]');
    expect(
      screen.getByText(messages.add_device_success_title.message).parentElement
        ?.parentElement,
    ).toHaveClass('flex-1', 'justify-center', 'gap-0');
  });

  it('renders singular copy for one imported account', () => {
    renderWithLocalization(
      <Success
        onDone={jest.fn()}
        syncedWalletCount={1}
        totalSelectedAccountCount={1}
      />,
    );

    expect(
      screen.getByText('1 account imported to MetaMask mobile'),
    ).toBeInTheDocument();
  });

  it('describes all synced accounts, not only imported private-key accounts', () => {
    renderWithLocalization(
      <Success
        onDone={jest.fn()}
        syncedWalletCount={1}
        syncedPrivateKeyAccountCount={0}
        totalSelectedAccountCount={3}
      />,
    );

    expect(
      screen.getByText('3 accounts imported to MetaMask mobile'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr-sync-success')).toHaveAttribute(
      'data-synced-account-count',
      '0',
    );
  });

  it('does not show a made-up count when none is provided', () => {
    renderWithLocalization(<Success onDone={jest.fn()} />);

    expect(screen.queryByText(/imported to MetaMask mobile/u)).toBeNull();
    expect(screen.getByTestId('qr-sync-success')).toHaveAttribute(
      'data-synced-wallet-count',
      '0',
    );
    expect(screen.getByTestId('qr-sync-success')).toHaveAttribute(
      'data-synced-account-count',
      '0',
    );
  });

  it('anchors the done button to the bottom of the screen', () => {
    renderWithLocalization(<Success onDone={jest.fn()} />);

    expect(
      screen.getByRole('button', { name: messages.done.message }),
    ).toHaveClass('absolute', 'bottom-4');
  });

  it('calls onDone when the done button is clicked', () => {
    const onDone = jest.fn();
    renderWithLocalization(<Success onDone={onDone} />);

    fireEvent.click(screen.getByText(messages.done.message));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
