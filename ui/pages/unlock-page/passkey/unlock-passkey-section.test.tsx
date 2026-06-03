import React from 'react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as actionsModule from '../../../store/actions';
import * as passkeyCeremony from '../../../../shared/lib/passkey/passkey-ceremony';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import { UnlockPasskeySection } from './unlock-passkey-section';

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment-type', () => {
  const actual = jest.requireActual<
    typeof import('../../../../shared/lib/environment-type')
  >('../../../../shared/lib/environment-type');
  return {
    ...actual,
    getEnvironmentType: jest.fn((url?: string) =>
      actual.getEnvironmentType(url),
    ),
  };
});

const getEnvironmentTypeMock = getEnvironmentType as jest.MockedFunction<
  typeof getEnvironmentType
>;

const mockOpenExtensionInBrowser = jest.fn();

beforeAll(() => {
  globalThis.platform = {
    ...globalThis.platform,
    openExtensionInBrowser: mockOpenExtensionInBrowser,
  } as unknown as typeof globalThis.platform;
});

const selectedTestAccountId = 'test-unlock-passkey-section-account-id';

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

describe('UnlockPasskeySection', () => {
  const baseProps = {
    logoSection: <div data-testid="logo-mock" />,
    isPasskeyActive: true,
    passkeyAutoUnlockSuppressed: true,
    mustDeferPasskeyToBrowserTab: false,
    isPasswordInProgress: false,
    onUnlockWithPasskey: jest.fn().mockResolvedValue(undefined),
    onUsePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentTypeMock.mockImplementation((url?: string) => {
      const actual = jest.requireActual<
        typeof import('../../../../shared/lib/environment-type')
      >('../../../../shared/lib/environment-type');
      return actual.getEnvironmentType(url);
    });
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

  it('renders passkey error banner when authentication fails with a non-silent error', async () => {
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockRejectedValueOnce({ code: PasskeyControllerErrorCode.NotEnrolled });

    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} passkeyAutoUnlockSuppressed />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(getByTestId('unlock-passkey-error-banner')).toBeInTheDocument();
    });
  });

  it('disables passkey unlock while password submit is in progress', () => {
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} isPasswordInProgress />,
      mockStore,
      '/unlock',
    );

    expect(getByTestId('unlock-passkey-button')).toBeDisabled();
  });

  it('calls onUsePassword when Use password is clicked', () => {
    const onUsePassword = jest.fn();
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} onUsePassword={onUsePassword} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-use-password-button'));

    expect(onUsePassword).toHaveBeenCalledTimes(1);
  });

  it('does not throw when unmounted while passkey authentication is pending', async () => {
    let resolveCeremony: (value: unknown) => void;
    const ceremonyPromise = new Promise((resolve) => {
      resolveCeremony = resolve;
    });
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockReturnValueOnce(ceremonyPromise as never);

    const { unmount, getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(passkeyCeremony.startPasskeyAuthentication).toHaveBeenCalled();
    });

    unmount();

    const credential = {
      id: 'cred',
      rawId: 'cred',
      type: 'public-key',
      response: {
        clientDataJSON: 'e30',
        authenticatorData: 'AA',
        signature: 'AQ',
      },
      clientExtensionResults: {},
    };

    await act(async () => {
      resolveCeremony(credential);
      await Promise.resolve();
    });
  });

  it('starts passkey ceremony once on mount when auto unlock is not suppressed', async () => {
    const onUnlockWithPasskey = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(
      <UnlockPasskeySection
        {...baseProps}
        passkeyAutoUnlockSuppressed={false}
        onUnlockWithPasskey={onUnlockWithPasskey}
      />,
      mockStore,
      '/unlock',
    );

    await waitFor(() => {
      expect(onUnlockWithPasskey).toHaveBeenCalledTimes(1);
    });
  });

  it('opens troubleshoot modal from the side panel while passkey is in progress', async () => {
    getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    let resolveCeremony: (value: unknown) => void;
    const ceremonyPromise = new Promise((resolve) => {
      resolveCeremony = resolve;
    });
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockReturnValueOnce(ceremonyPromise as never);

    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(
        getByTestId('unlock-passkey-troubleshoot-button'),
      ).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('unlock-passkey-troubleshoot-button'));

    await waitFor(() => {
      expect(getByTestId('passkey-troubleshoot-modal')).toBeInTheDocument();
    });

    fireEvent.click(
      getByTestId('passkey-troubleshoot-open-full-screen-button'),
    );

    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(UNLOCK_ROUTE);

    await act(async () => {
      resolveCeremony({
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
      await Promise.resolve();
    });
  });

  describe('when mustDeferPasskeyToBrowserTab', () => {
    const openExtensionInBrowser = jest.fn();

    beforeEach(() => {
      globalThis.platform = {
        openExtensionInBrowser,
      } as never;
    });

    afterEach(() => {
      delete (globalThis as { platform?: unknown }).platform;
    });

    it('does not start passkey ceremony on mount when auto unlock is not suppressed', async () => {
      const onUnlockWithPasskey = jest.fn().mockResolvedValue(undefined);

      renderWithProvider(
        <UnlockPasskeySection
          {...baseProps}
          passkeyAutoUnlockSuppressed={false}
          mustDeferPasskeyToBrowserTab
          onUnlockWithPasskey={onUnlockWithPasskey}
        />,
        mockStore,
        '/unlock',
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(onUnlockWithPasskey).not.toHaveBeenCalled();
      expect(openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens extension in browser when primary passkey button is clicked', async () => {
      const onUnlockWithPasskey = jest.fn().mockResolvedValue(undefined);

      const { getByTestId } = renderWithProvider(
        <UnlockPasskeySection
          {...baseProps}
          mustDeferPasskeyToBrowserTab
          onUnlockWithPasskey={onUnlockWithPasskey}
        />,
        mockStore,
        '/unlock',
      );

      fireEvent.click(getByTestId('unlock-passkey-button'));

      expect(openExtensionInBrowser).toHaveBeenCalledWith(UNLOCK_ROUTE);
      expect(onUnlockWithPasskey).not.toHaveBeenCalled();
    });
  });
});
