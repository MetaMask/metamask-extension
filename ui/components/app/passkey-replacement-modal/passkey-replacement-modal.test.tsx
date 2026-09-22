import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { PasskeyPRFRequiredError } from '../../../../shared/lib/passkey/passkey-capabilities';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  forceUpdateMetamaskState,
  verifyPassword,
} from '../../../store/actions';
import PasskeyReplacementModal from './passkey-replacement-modal';

const mockReplacePasskey = jest.fn();

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

jest.mock('../../../hooks/passkey/usePasskeyReplacement', () => ({
  usePasskeyReplacement: () => ({
    replacePasskey: mockReplacePasskey,
  }),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual<typeof import('../../../store/actions')>(
    '../../../store/actions',
  ),
  forceUpdateMetamaskState: jest.fn(),
  verifyPassword: jest.fn(),
}));

describe('PasskeyReplacementModal', () => {
  const onComplete = jest.fn();
  const onRemindMeLater = jest.fn();
  const store = configureMockStore([thunk])({});

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(verifyPassword).mockResolvedValue(true);
    jest.mocked(forceUpdateMetamaskState).mockResolvedValue(undefined);
    mockReplacePasskey.mockImplementation(async ({ onStageChange }) => {
      onStageChange?.('register');
      onStageChange?.('verify');
      onStageChange?.('complete');
    });
  });

  function renderModal() {
    return renderWithProvider(
      <PasskeyReplacementModal
        onComplete={onComplete}
        onRemindMeLater={onRemindMeLater}
      />,
      store,
    );
  }

  it('collects the wallet password and completes replacement', async () => {
    const { getByTestId } = renderModal();

    fireEvent.change(getByTestId('passkey-replacement-password-input'), {
      target: { value: 'wallet-password' },
    });
    fireEvent.click(getByTestId('passkey-replacement-continue-button'));

    await waitFor(() => {
      expect(mockReplacePasskey).toHaveBeenCalledWith({
        password: 'wallet-password',
        onStageChange: expect.any(Function),
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(verifyPassword).toHaveBeenCalledWith('wallet-password');
    expect(forceUpdateMetamaskState).toHaveBeenCalled();
  });

  it('shows an incorrect-password error and does not start replacement', async () => {
    jest.mocked(verifyPassword).mockRejectedValueOnce(new Error('wrong'));
    const { getByTestId } = renderModal();

    fireEvent.change(getByTestId('passkey-replacement-password-input'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(getByTestId('passkey-replacement-continue-button'));

    await waitFor(() => {
      expect(getByTestId('passkey-replacement-password-input')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
    expect(mockReplacePasskey).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows the unsupported-passkey error and allows retrying', async () => {
    mockReplacePasskey.mockRejectedValueOnce(new PasskeyPRFRequiredError());
    const { getByTestId, getByText } = renderModal();

    fireEvent.change(getByTestId('passkey-replacement-password-input'), {
      target: { value: 'wallet-password' },
    });
    fireEvent.click(getByTestId('passkey-replacement-continue-button'));

    await waitFor(() => {
      expect(
        getByText(messages.passkeyErrorNotSupported.message),
      ).toBeInTheDocument();
    });
    expect(
      getByTestId('passkey-replacement-password-input'),
    ).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.change(getByTestId('passkey-replacement-password-input'), {
      target: { value: 'wallet-password' },
    });
    fireEvent.click(getByTestId('passkey-replacement-continue-button'));

    await waitFor(() => {
      expect(mockReplacePasskey).toHaveBeenCalledTimes(2);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('leaves the migration when the user chooses remind me later', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId('passkey-replacement-remind-me-later-button'));

    expect(onRemindMeLater).toHaveBeenCalledTimes(1);
  });
});
