import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { BaseUrl } from '../../../../shared/constants/urls';
import PasskeyMigrationModal from './passkey-migration-modal';

describe('PasskeyMigrationModal', () => {
  it('renders the migration message and both actions', () => {
    const { getByRole, getByTestId, getByText } = renderWithProvider(
      <PasskeyMigrationModal
        onReplacePasskey={jest.fn()}
        onRemindMeLater={jest.fn()}
      />,
    );

    expect(getByTestId('passkey-migration-modal')).toBeInTheDocument();
    expect(
      getByText(messages.passkeyMigrationTitle.message),
    ).toBeInTheDocument();
    expect(getByTestId('passkey-migration-description-1')).toHaveTextContent(
      messages.passkeyMigrationDescription1.message,
    );
    expect(getByTestId('passkey-migration-description-2')).toHaveTextContent(
      messages.passkeyMigrationDescription2.message.replace(
        '$1',
        messages.passkeyMigrationSupportedProviders.message,
      ),
    );
    expect(getByTestId('passkey-migration-description-3')).toHaveTextContent(
      messages.passkeyMigrationDescription3.message,
    );
    expect(
      getByRole('link', {
        name: messages.passkeyMigrationSupportedProviders.message,
      }),
    ).toHaveAttribute('href', BaseUrl.MetaMask);
    expect(getByText(messages.replacePasskey.message)).toBeInTheDocument();
    expect(getByText(messages.remindMeLater.message)).toBeInTheDocument();
  });

  it('calls onReplacePasskey when Replace passkey is clicked', () => {
    const onReplacePasskey = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PasskeyMigrationModal
        onReplacePasskey={onReplacePasskey}
        onRemindMeLater={jest.fn()}
      />,
    );

    fireEvent.click(getByTestId('passkey-migration-modal-replace-button'));

    expect(onReplacePasskey).toHaveBeenCalledTimes(1);
  });

  it('calls onRemindMeLater when Remind me later is clicked', () => {
    const onRemindMeLater = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PasskeyMigrationModal
        onReplacePasskey={jest.fn()}
        onRemindMeLater={onRemindMeLater}
      />,
    );

    fireEvent.click(
      getByTestId('passkey-migration-modal-remind-me-later-button'),
    );

    expect(onRemindMeLater).toHaveBeenCalledTimes(1);
  });
});
