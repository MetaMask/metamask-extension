import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { PasskeyPRFRequiredError } from '../../../../shared/lib/passkey/passkey-capabilities';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { forceUpdateMetamaskState } from '../../../store/actions';
import PasskeyReplacementModal from './passkey-replacement-modal';

const mockReplacePasskey = jest.fn();
const mockTrackEvent = jest.fn();

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

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
      createEventBuilder,
    }),
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual<typeof import('../../../store/actions')>(
    '../../../store/actions',
  ),
  forceUpdateMetamaskState: jest.fn(),
}));

describe('PasskeyReplacementModal', () => {
  const onComplete = jest.fn();
  const onRemindMeLater = jest.fn();
  const store = configureMockStore([thunk])({
    metamask: {
      firstTimeFlowType: null,
      passkeyRecord: {
        keyDerivation: {
          method: 'userHandle',
        },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('uses the shared setup content and completes replacement', async () => {
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId('passkey-set-up-button'));

    await waitFor(
      () => {
        expect(mockReplacePasskey).toHaveBeenCalledWith({
          onStageChange: expect.any(Function),
        });
        expect(onComplete).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    expect(forceUpdateMetamaskState).toHaveBeenCalled();
  });

  it('shows an error when the controller rejects replacement', async () => {
    mockReplacePasskey.mockRejectedValueOnce(new Error('wrong'));
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId('passkey-set-up-button'));

    await waitFor(() => {
      expect(getByTestId('passkey-enrollment-error')).toBeInTheDocument();
    });
    expect(mockReplacePasskey).toHaveBeenCalledWith({
      onStageChange: expect.any(Function),
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows the unsupported-passkey error and allows retrying', async () => {
    mockReplacePasskey.mockRejectedValueOnce(new PasskeyPRFRequiredError());
    const { getByTestId, getByText } = renderModal();

    fireEvent.click(getByTestId('passkey-set-up-button'));

    await waitFor(() => {
      expect(
        getByText(messages.passkeyErrorNotSupported.message),
      ).toBeInTheDocument();
    });
    expect(getByTestId('passkey-set-up-button')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('passkey-set-up-button'));

    await waitFor(
      () => {
        expect(mockReplacePasskey).toHaveBeenCalledTimes(2);
        expect(onComplete).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });

  it('leaves the migration when the user chooses remind me later', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId('passkey-maybe-later-button'));

    expect(onRemindMeLater).toHaveBeenCalledTimes(1);
  });
});
