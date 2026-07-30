import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import SenderToRecipient from './sender-to-recipient.component';
import { CARDS_VARIANT } from './sender-to-recipient.constants';

jest.mock('../../app/name/name', () => () => (
  <div data-testid="recipient-name" />
));

jest.mock('../../app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));

jest.mock(
  '../account-mismatch-warning/account-mismatch-warning.component',
  () => () => <div data-testid="account-mismatch-warning" />,
);

const SENDER_ADDRESS = '0x1234567890123456789012345678901234567890';
const RECIPIENT_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

describe('SenderToRecipient', () => {
  it('uses default variant and mismatch warning when props are omitted', () => {
    const { getByTestId, container } = renderWithProvider(
      <SenderToRecipient
        senderAddress={SENDER_ADDRESS}
        recipientAddress={RECIPIENT_ADDRESS}
        senderName="Alice"
      />,
    );

    expect(getByTestId('sender-to-recipient')).toHaveClass(
      'sender-to-recipient--default',
    );
    expect(getByTestId('account-mismatch-warning')).toBeInTheDocument();
    expect(
      container.querySelector('.sender-to-recipient__arrow-circle'),
    ).toBeInTheDocument();
    expect(getByTestId('recipient-name')).toBeInTheDocument();
  });

  it('renders non-default variant and new contract when recipient is missing', () => {
    const { getByTestId, getByText, queryByTestId } = renderWithProvider(
      <SenderToRecipient
        senderAddress={SENDER_ADDRESS}
        senderName="Alice"
        variant={CARDS_VARIANT}
        warnUserOnAccountMismatch={false}
      />,
    );

    expect(getByTestId('sender-to-recipient')).toHaveClass(
      'sender-to-recipient--cards',
    );
    expect(queryByTestId('account-mismatch-warning')).not.toBeInTheDocument();
    expect(getByText(messages.newContract.message)).toBeInTheDocument();
  });
});
