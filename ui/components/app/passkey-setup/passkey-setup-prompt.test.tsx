import React from 'react';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { BaseUrl } from '../../../../shared/constants/urls';
import { PasskeySetupPrompt } from './passkey-setup-prompt';

const PASSKEY_METHOD_LABEL = 'Biometrics';
const PASSKEY_METHOD_SPECIFIC_LABEL = 'Touch ID';

function renderPrompt({
  enrollmentError = null,
  isPrfMigrationError = false,
}: {
  enrollmentError?: string | null;
  isPrfMigrationError?: boolean;
} = {}) {
  return renderWithProvider(
    <PasskeySetupPrompt
      enrollmentError={enrollmentError}
      isPrfMigrationError={isPrfMigrationError}
      passkeyMethodLabel={PASSKEY_METHOD_LABEL}
      passkeyMethodSpecificLabel={PASSKEY_METHOD_SPECIFIC_LABEL}
      onSetup={jest.fn()}
      onSkip={jest.fn()}
    />,
  );
}

describe('PasskeySetupPrompt', () => {
  it('renders the enrollment title and description', () => {
    const { getByRole, getByText, queryByRole, queryByTestId } = renderPrompt();

    expect(
      getByText(
        messages.unlockWithPasskey.message.replace('$1', PASSKEY_METHOD_LABEL),
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        messages.passkeyDescription.message.replace(
          '$1',
          PASSKEY_METHOD_SPECIFIC_LABEL,
        ),
      ),
    ).toBeInTheDocument();
    expect(
      getByRole('button', {
        name: messages.setUpPasskey.message.replace('$1', PASSKEY_METHOD_LABEL),
      }),
    ).toBeInTheDocument();
    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
    expect(queryByTestId('passkey-enrollment-error')).not.toBeInTheDocument();
    expect(
      queryByRole('link', {
        name: messages.passkeyMigrationSupportedProviders.message,
      }),
    ).not.toBeInTheDocument();
  });

  it('keeps the enrollment copy and shows the ceremony error', () => {
    const enrollmentError = 'Biometrics setup failed. Try again';
    const { getByTestId, getByText } = renderPrompt({ enrollmentError });

    expect(
      getByText(
        messages.unlockWithPasskey.message.replace('$1', PASSKEY_METHOD_LABEL),
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        messages.passkeyDescription.message.replace(
          '$1',
          PASSKEY_METHOD_SPECIFIC_LABEL,
        ),
      ),
    ).toBeInTheDocument();
    expect(getByTestId('passkey-enrollment-error')).toHaveTextContent(
      enrollmentError,
    );
  });

  it('renders the PRF migration failure title and description', () => {
    const { container, getByRole, getByText, queryByTestId } = renderPrompt({
      isPrfMigrationError: true,
    });

    expect(
      getByText(messages.passkeyMigrationReplacementTitle.message),
    ).toBeInTheDocument();
    expect(container.querySelector('p')).toHaveTextContent(
      messages.passkeyMigrationReplacementDescription.message.replace(
        '$1',
        messages.passkeyMigrationSupportedProviders.message,
      ),
    );
    expect(
      getByRole('link', {
        name: messages.passkeyMigrationSupportedProviders.message,
      }),
    ).toHaveAttribute('href', BaseUrl.MetaMask);
    expect(
      getByRole('button', {
        name: messages.passkeyMigrationReplacementTryAgain.message,
      }),
    ).toBeInTheDocument();
    expect(
      getByText(messages.passkeyMigrationReplacementKeepCurrent.message),
    ).toBeInTheDocument();
    expect(queryByTestId('passkey-enrollment-error')).not.toBeInTheDocument();
  });
});
