import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import Success from './success';

describe('Success', () => {
  it('renders the title, imported account count, and compact check illustration', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={2} importedAccountCount={18} />,
    );

    expect(
      screen.getByText(messages.add_device_success_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText('18 accounts imported to your other device.'),
    ).toBeInTheDocument();
    const illustration = screen.getByTestId('qr-sync-success-illustration');
    expect(illustration).toHaveClass('h-[72px]', 'w-[72px]', 'rounded-full');
    expect(screen.getByTestId('qr-sync-success-check')).toHaveAttribute(
      'src',
      './images/qr-sync-success-check.svg',
    );
    expect(screen.getByTestId('qr-sync-success-check')).toHaveAttribute(
      'width',
      '32',
    );
  });

  it('renders singular copy for one imported account', () => {
    renderWithLocalization(
      <Success onDone={jest.fn()} walletCount={1} importedAccountCount={1} />,
    );

    expect(
      screen.getByText('1 account imported to your other device.'),
    ).toBeInTheDocument();
  });

  it('anchors the done button to the bottom of the screen', () => {
    renderWithLocalization(<Success onDone={jest.fn()} />);

    expect(
      screen.getByRole('button', { name: messages.done.message }),
    ).toHaveClass('mt-auto');
  });

  it('calls onDone when the done button is clicked', () => {
    const onDone = jest.fn();
    renderWithLocalization(<Success onDone={onDone} />);

    fireEvent.click(screen.getByText(messages.done.message));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
