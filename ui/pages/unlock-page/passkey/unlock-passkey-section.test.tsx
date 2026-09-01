import React from 'react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import { UnlockPasskeySection } from './unlock-passkey-section';

const mockTrackEvent = jest.fn();
const mockUnlockWithPasskey = jest.fn();

jest.mock('../../../hooks/passkey/usePasskeyUnlock', () => ({
  usePasskeyUnlock: () => mockUnlockWithPasskey,
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

function setMockPasskeyRecord(passkeyRecord: unknown) {
  (
    mockStore.getState() as {
      metamask: { passkeyRecord?: unknown };
    }
  ).metamask.passkeyRecord = passkeyRecord;
}

describe('UnlockPasskeySection', () => {
  const baseProps = {
    logoSection: <div data-testid="logo-mock" />,
    isPasskeyActive: true,
    passkeyAutoUnlockSuppressed: true,
    mustDeferPasskeyToBrowserTab: false,
    isPasswordInProgress: false,
    onUnlockSuccess: jest.fn().mockResolvedValue(undefined),
    onUsePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setMockPasskeyRecord(null);
    mockUnlockWithPasskey.mockResolvedValue(undefined);
    getEnvironmentTypeMock.mockImplementation((url?: string) => {
      const actual = jest.requireActual<
        typeof import('../../../../shared/lib/environment-type')
      >('../../../../shared/lib/environment-type');
      return actual.getEnvironmentType(url);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders passkey error banner when authentication fails with a non-silent error', async () => {
    mockUnlockWithPasskey.mockRejectedValueOnce({
      code: PasskeyControllerErrorCode.NotEnrolled,
    });

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

  it('tracks the authenticator AAGUID for unlock events', async () => {
    setMockPasskeyRecord({
      credential: {
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
      },
    });
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    });
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authenticator_id: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
        }),
      }),
    );
  });

  it('does not throw when unmounted while passkey authentication is pending', async () => {
    let resolveCeremony: (value: unknown) => void;
    const ceremonyPromise = new Promise((resolve) => {
      resolveCeremony = resolve;
    });
    mockUnlockWithPasskey.mockReturnValueOnce(ceremonyPromise);

    const { unmount, getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(mockUnlockWithPasskey).toHaveBeenCalled();
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
    const onUnlockSuccess = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(
      <UnlockPasskeySection
        {...baseProps}
        passkeyAutoUnlockSuppressed={false}
        onUnlockSuccess={onUnlockSuccess}
      />,
      mockStore,
      '/unlock',
    );

    await waitFor(() => {
      expect(onUnlockSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('opens troubleshoot modal from the side panel while passkey is in progress', async () => {
    getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    let resolveCeremony: (value: unknown) => void;
    const ceremonyPromise = new Promise((resolve) => {
      resolveCeremony = resolve;
    });
    mockUnlockWithPasskey.mockReturnValueOnce(ceremonyPromise);

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
      const onUnlockSuccess = jest.fn().mockResolvedValue(undefined);

      renderWithProvider(
        <UnlockPasskeySection
          {...baseProps}
          passkeyAutoUnlockSuppressed={false}
          mustDeferPasskeyToBrowserTab
          onUnlockSuccess={onUnlockSuccess}
        />,
        mockStore,
        '/unlock',
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockUnlockWithPasskey).not.toHaveBeenCalled();
      expect(onUnlockSuccess).not.toHaveBeenCalled();
      expect(openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('opens extension in browser when primary passkey button is clicked', async () => {
      const onUnlockSuccess = jest.fn().mockResolvedValue(undefined);

      const { getByTestId } = renderWithProvider(
        <UnlockPasskeySection
          {...baseProps}
          mustDeferPasskeyToBrowserTab
          onUnlockSuccess={onUnlockSuccess}
        />,
        mockStore,
        '/unlock',
      );

      fireEvent.click(getByTestId('unlock-passkey-button'));

      expect(openExtensionInBrowser).toHaveBeenCalledWith(UNLOCK_ROUTE);
      expect(mockUnlockWithPasskey).not.toHaveBeenCalled();
      expect(onUnlockSuccess).not.toHaveBeenCalled();
    });
  });
});
