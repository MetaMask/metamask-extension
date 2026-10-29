import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import Success from './success';

describe('Success', () => {
  it('renders the title and description for multiple wallets and imported accounts', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={2} importedAccountCount={5} />,
    );

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '2 wallets and 5 imported accounts were synced to your phone.',
      ),
    ).toBeInTheDocument();
  });

  it('renders singular copy when one wallet and one imported account are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={1} importedAccountCount={1} />,
    );

    expect(
      screen.getByText(
        messages.add_device_success_desc_wallet_singular_imported_singular
          .message,
      ),
    ).toBeInTheDocument();
  });

  it('renders only the wallet clause when no imported accounts are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={3} importedAccountCount={0} />,
    );

    expect(
      screen.getByText('3 wallets were synced to your phone.'),
    ).toBeInTheDocument();
  });

  it('renders singular wallet copy when a single wallet and no imported accounts are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={1} importedAccountCount={0} />,
    );

    expect(
      screen.getByText(
        messages.add_device_success_desc_wallet_singular.message,
      ),
    ).toBeInTheDocument();
  });

  it('renders only the imported account clause when no wallets are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={0} importedAccountCount={4} />,
    );

    expect(
      screen.getByText('4 imported accounts were synced to your phone.'),
    ).toBeInTheDocument();
  });

  it('renders singular imported account copy when a single imported account and no wallets are synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={0} importedAccountCount={1} />,
    );

    expect(
      screen.getByText(
        messages.add_device_success_desc_imported_singular.message,
      ),
    ).toBeInTheDocument();
  });

  it('renders no description when nothing is synced', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={0} importedAccountCount={0} />,
    );

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(screen.queryByText(/synced to your phone/u)).not.toBeInTheDocument();
  });

  it('calls onDone when the done button is clicked', () => {
    const onDone = jest.fn();
    renderWithLocalization(<Success onDone={onDone} />);

    fireEvent.click(screen.getByText(messages.done.message));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
