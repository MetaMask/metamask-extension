import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
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

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/sentry')>(
    '../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

describe('UnlockPage component (passkey UI)', () => {
  const selectedTestAccountId = 'test-unlock-account-id';

  const mockStore = configureMockStore([thunk])({
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

  const buildProps = (overrides: Record<string, unknown> = {}) => ({
    navigate: jest.fn(),
    location: { pathname: '/unlock', state: undefined },
    isUnlocked: false,
    isOnboardingCompleted: true,
    onRestore: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    navigateAfterUnlock: jest.fn(),
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

  it('completes passkey unlock when user clicks passkey', async () => {
    const props = buildProps();

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(props.onUnlockWithPasskey).toHaveBeenCalled();
      expect(props.navigateAfterUnlock).toHaveBeenCalled();
    });
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
