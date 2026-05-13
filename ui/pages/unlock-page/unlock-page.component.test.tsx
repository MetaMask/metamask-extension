import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import * as actionsModule from '../../store/actions';
import * as passkeyCeremony from '../../../shared/lib/passkey/passkey-ceremony';
import UnlockPage from './unlock-page.component';

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

describe('UnlockPage component (passkey UI)', () => {
  const mockStore = configureMockStore([thunk])({
    metamask: { passkeyRecord: null },
  });

  const buildProps = (overrides: Record<string, unknown> = {}) => ({
    navigate: jest.fn(),
    location: { pathname: '/unlock', state: undefined },
    isUnlocked: false,
    isOnboardingCompleted: true,
    onRestore: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    isPasskeyActive: true,
    onUnlockWithPasskey: jest.fn().mockResolvedValue(undefined),
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
    jest
      .spyOn(actionsModule, 'generatePasskeyAuthenticationOptions')
      .mockResolvedValue({
        challenge: 'AQ',
        allowCredentials: [{ id: 'AQ', type: 'public-key' }],
        userVerification: 'required',
      } as never);
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockResolvedValue({
        id: 'cred',
        rawId: 'cred',
        type: 'public-key',
        response: {
          clientDataJSON: 'e30',
          authenticatorData: 'AA',
          signature: 'AQ',
        },
        clientExtensionResults: {},
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes passkey unlock and records an App Unlocked metrics event', async () => {
    const trackEvent = jest.fn().mockResolvedValue(undefined);
    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
      undefined,
      () => trackEvent,
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(props.onUnlockWithPasskey).toHaveBeenCalled();
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: MetaMetricsEventName.AppUnlocked,
        properties: { method: 'passkey' },
      }),
    );
  });

  it('shows a passkey error banner when authentication fails with a non-silent error', async () => {
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockRejectedValueOnce({ code: PasskeyControllerErrorCode.NotEnrolled });

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
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockRejectedValueOnce(
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
      expect(passkeyCeremony.startPasskeyAuthentication).toHaveBeenCalled();
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

  it('cancels an in-flight passkey ceremony when the component unmounts', () => {
    const cancelSpy = jest.spyOn(passkeyCeremony, 'cancelPasskeyCeremony');
    const props = buildProps();

    const { unmount } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
