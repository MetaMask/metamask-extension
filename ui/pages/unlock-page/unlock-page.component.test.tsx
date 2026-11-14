import React from 'react';
import { it as jestIt } from '@jest/globals';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createDeferredPromise } from '@metamask/utils';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import * as passkeyCeremony from '../../../shared/lib/passkey/passkey-ceremony';
import { ONBOARDING_PASSKEY_PRF_MIGRATION_ROUTE } from '../../helpers/constants/routes';
import { discardUnlockMeasurement, UnlockReady } from './unlock-performance';
import UnlockPage from './unlock-page.component';

const mockTrackEvent = jest.fn();
const mockUnlockWithPasskey = jest.fn();

jest.mock('./unlock-performance', () => ({
  discardUnlockMeasurement: jest.fn(),
  UnlockReady: jest.fn(() => null),
}));

jest.mock('../../hooks/passkey/usePasskeyUnlock', () => ({
  usePasskeyUnlock: () => mockUnlockWithPasskey,
}));

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
      createEventBuilder,
    }),
  };
});

jest.mock('../../hooks/useSegmentContext', () => ({
  useSegmentContext: () => ({ page: { title: 'Unlock' } }),
}));

const mockLogoElement = document.createElement('svg');

jest.mock('../onboarding-flow/welcome/fox-appear-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
  __esModule: true,
  default: () => <div data-testid="fox-appear-animation" />,
}));

jest.mock('@metamask/logo', () => () => ({
  container: mockLogoElement,
  setFollowMouse: jest.fn(),
  stopAnimation: jest.fn(),
  lookAt: jest.fn(),
  lookAtAndRender: jest.fn(),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/sentry')>(
    '../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

describe('UnlockPage component', () => {
  const selectedTestAccountId = 'test-unlock-account-id';

  const mockStore = configureMockStore([thunk])({
    confirmTransaction: {
      txData: {},
    },
    metamask: {
      passkeyRecord: null,
      internalAccounts: {
        selectedAccount: selectedTestAccountId,
        accounts: {
          [selectedTestAccountId]: {
            address: '0x0000000000000000000000000000000000000001',
            id: selectedTestAccountId,
            metadata: {
              name: 'Test',
              keyring: { type: 'HD Key Tree' },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            scopes: [EthScope.Eoa],
          },
        },
      },
    },
  });

  function setMockPasskeyRecord(passkeyRecord: unknown) {
    (
      mockStore.getState() as {
        metamask: { passkeyRecord?: unknown };
      }
    ).metamask.passkeyRecord = passkeyRecord;
  }

  const buildProps = (overrides: Record<string, unknown> = {}) => ({
    navigate: jest.fn(),
    location: { pathname: '/unlock', state: undefined },
    isUnlocked: false,
    isOnboardingCompleted: true,
    onRestore: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    navigateAfterUnlock: jest.fn(),
    isPasskeyActive: true,
    checkIsSeedlessPasswordOutdated: jest.fn().mockResolvedValue(undefined),
    getIsSeedlessOnboardingUserAuthenticated: jest.fn().mockResolvedValue(true),
    forceUpdateMetamaskState: jest.fn().mockResolvedValue(undefined),
    isSocialLoginFlow: false,
    onboardingParentContext: { current: null },
    loginWithDifferentMethod: jest.fn().mockResolvedValue(undefined),
    firstTimeFlowType: null,
    resetWallet: jest.fn().mockResolvedValue(undefined),
    isPopup: false,
    isWalletResetInProgress: false,
    passkeyAutoUnlockSuppressed: true,
    mustDeferPasskeyToBrowserTab: false,
    ...overrides,
  });

  beforeEach(() => {
    mockUnlockWithPasskey.mockReset();
    mockUnlockWithPasskey.mockResolvedValue(undefined);
    setMockPasskeyRecord(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useful screen readiness', () => {
    beforeEach(() => {
      jest.mocked(discardUnlockMeasurement).mockClear();
    });

    it('excludes successful automatic passkey authentication with real navigation', async () => {
      const unlock = createDeferredPromise<void>();
      mockUnlockWithPasskey.mockReturnValueOnce(unlock.promise);

      const UnlockRoute = () => {
        const navigate = useNavigate();
        const { pathname } = useLocation();
        return pathname === '/unlock' ? (
          <UnlockPage
            {...buildProps({
              passkeyAutoUnlockSuppressed: false,
              navigateAfterUnlock: async () => navigate('/', { replace: true }),
            })}
          />
        ) : (
          <div data-testid="unlocked-home" />
        );
      };

      const { getByTestId } = renderWithProvider(
        <UnlockRoute />,
        mockStore,
        '/unlock',
      );
      expect(mockUnlockWithPasskey).toHaveBeenCalledTimes(1);
      expect(discardUnlockMeasurement).toHaveBeenCalledTimes(1);
      expect(jest.mocked(UnlockReady).mock.lastCall?.[0].ready).toBe(false);

      await act(async () => unlock.resolve());
      expect(getByTestId('unlocked-home')).toBeInTheDocument();
    });

    jestIt.each([false, true])(
      'reports an idle form with passkeys enabled: %s',
      (isPasskeyActive) => {
        renderWithProvider(
          <UnlockPage {...buildProps({ isPasskeyActive })} />,
          mockStore,
          '/unlock',
        );

        expect(jest.mocked(UnlockReady).mock.lastCall?.[0].ready).toBe(true);
        expect(discardUnlockMeasurement).not.toHaveBeenCalled();
      },
    );
  });

  it('completes passkey unlock when user clicks passkey', async () => {
    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(mockUnlockWithPasskey).toHaveBeenCalled();
      expect(props.navigateAfterUnlock).toHaveBeenCalled();
    });
  });

  it('navigates to passkey migration after a legacy passkey unlock', async () => {
    setMockPasskeyRecord({
      keyDerivation: { method: 'userHandle' },
    });
    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(mockUnlockWithPasskey).toHaveBeenCalledTimes(1);
      expect(props.navigate).toHaveBeenCalledWith(
        ONBOARDING_PASSKEY_PRF_MIGRATION_ROUTE,
        {
          replace: true,
          state: undefined,
        },
      );
    });
    expect(props.navigateAfterUnlock).not.toHaveBeenCalled();
  });

  it('navigates after a successful password unlock', async () => {
    const props = buildProps({ isPasskeyActive: false });

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.change(getByTestId('unlock-password'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('unlock-submit'));

    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalledWith('test-password');
      expect(props.navigateAfterUnlock).toHaveBeenCalled();
    });
  });

  describe('password unlock metrics', () => {
    beforeEach(() => {
      mockTrackEvent.mockClear();
    });

    jestIt.each([
      'Incorrect password',
      SeedlessOnboardingControllerErrorMessage.IncorrectPassword,
    ])('counts repeated failures without error data: %s', async (message) => {
      const onSubmit = jest
        .fn()
        .mockRejectedValueOnce(new Error(message))
        .mockRejectedValueOnce(new Error(message))
        .mockResolvedValue(undefined);
      const props = buildProps({ isPasskeyActive: false, onSubmit });
      const { getByTestId } = renderWithProvider(
        <UnlockPage {...props} />,
        mockStore,
        '/unlock',
      );

      fireEvent.change(getByTestId('unlock-password'), {
        target: { value: 'test-password' },
      });

      for (const failedAttempts of [1, 2]) {
        fireEvent.click(getByTestId('unlock-submit'));

        await waitFor(() => {
          expect(mockTrackEvent).toHaveBeenLastCalledWith(
            expect.objectContaining({
              name: MetaMetricsEventName.AppUnlockedFailed,
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                failed_attempts: failedAttempts,
                reason: 'incorrect_password',
              }),
            }),
          );
        });
      }

      fireEvent.click(getByTestId('unlock-submit'));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenLastCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.AppUnlocked,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: expect.objectContaining({ failed_attempts: 2 }),
          }),
        );
        expect(props.navigateAfterUnlock).toHaveBeenCalledTimes(1);
      });
    });

    jestIt.each([
      [SeedlessOnboardingControllerErrorMessage.IncorrectPassword, 0],
      [SeedlessOnboardingControllerErrorMessage.IncorrectPassword, 4],
      [SeedlessOnboardingControllerErrorMessage.TooManyLoginAttempts, 5],
    ])('preserves the supplied count for %s: %s', async (message, count) => {
      const props = buildProps({
        isPasskeyActive: false,
        onSubmit: jest.fn().mockRejectedValue({
          message,
          data: { numberOfAttempts: count },
        }),
      });
      const { getByTestId } = renderWithProvider(
        <UnlockPage {...props} />,
        mockStore,
        '/unlock',
      );

      fireEvent.change(getByTestId('unlock-password'), {
        target: { value: 'test-password' },
      });
      fireEvent.click(getByTestId('unlock-submit'));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenLastCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.AppUnlockedFailed,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: expect.objectContaining({ failed_attempts: count }),
          }),
        );
      });
    });

    it('does not count unrelated errors as incorrect passwords', async () => {
      const props = buildProps({
        isPasskeyActive: false,
        onSubmit: jest
          .fn()
          .mockRejectedValueOnce(new Error('Unexpected error'))
          .mockResolvedValue(undefined),
      });
      const { getByTestId, findByText } = renderWithProvider(
        <UnlockPage {...props} />,
        mockStore,
        '/unlock',
      );

      fireEvent.change(getByTestId('unlock-password'), {
        target: { value: 'test-password' },
      });
      fireEvent.click(getByTestId('unlock-submit'));
      await findByText('Unexpected error');
      fireEvent.click(getByTestId('unlock-submit'));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenLastCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.AppUnlocked,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: expect.objectContaining({ failed_attempts: 0 }),
          }),
        );
      });
    });
  });

  it('shows a passkey error banner when authentication fails with a non-silent error', async () => {
    mockUnlockWithPasskey.mockRejectedValueOnce({
      code: PasskeyControllerErrorCode.NotEnrolled,
    });

    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(getByTestId('unlock-passkey-error-banner')).toBeInTheDocument();
    });
  });

  it('does not show a passkey error banner when the user cancels WebAuthn', async () => {
    mockUnlockWithPasskey.mockRejectedValueOnce(
      new DOMException('Not allowed', 'NotAllowedError'),
    );

    const props = buildProps();

    const { getByTestId, queryByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(mockUnlockWithPasskey).toHaveBeenCalled();
    });

    expect(
      queryByTestId('unlock-passkey-error-banner'),
    ).not.toBeInTheDocument();
  });

  it('switches to password unlock when Use password is clicked', async () => {
    const cancelSpy = jest.spyOn(passkeyCeremony, 'cancelPasskeyCeremony');
    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-use-password-button'));

    expect(cancelSpy).toHaveBeenCalled();
    expect(getByTestId('unlock-password')).toBeInTheDocument();
  });

  it('returns to passkey-first view when fingerprint is clicked from password mode', async () => {
    const props = buildProps({ passkeyAutoUnlockSuppressed: true });

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-use-password-button'));
    expect(getByTestId('unlock-password')).toBeInTheDocument();

    fireEvent.click(getByTestId('unlock-with-passkey'));

    await waitFor(() => {
      expect(getByTestId('unlock-passkey-button')).toBeInTheDocument();
    });
  });
});
