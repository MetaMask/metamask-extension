import React from 'react';
import { fireEvent, waitFor, screen, render } from '@testing-library/react';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import * as BrowserRuntimeUtils from '../../../../shared/lib/browser-runtime.utils';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import configureStore from '../../../store/store';
import { UPDATE_METAMASK_STATE } from '../../../store/actionConstants';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  generatePasskeyPostRegistrationAuthenticationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import {
  startPasskeyRegistration,
  startPasskeyAuthentication,
} from '../../../../shared/lib/passkey';
import SetupPasskeyContent from '../../../components/app/setup-passkey-content';
import SetupPasskey from './setup-passkey';

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/passkey')>(
    '../../../../shared/lib/passkey',
  ),
  startPasskeyRegistration: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      attestationObject: 'e30',
    },
    clientExtensionResults: {},
  }),
  startPasskeyAuthentication: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      authenticatorData: 'AA',
      signature: 'AA',
    },
    clientExtensionResults: {},
  }),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

const mockAuthenticationResponse = {
  id: 'AQ',
  rawId: 'AQ',
  type: 'public-key' as const,
  response: {
    clientDataJSON: 'e30',
    authenticatorData: 'AA',
    signature: 'AA',
  },
  clientExtensionResults: {},
};

jest.mock('../../../store/actions', () => {
  const actual = jest.requireActual('../../../store/actions');
  return {
    ...actual,
    generatePasskeyRegistrationOptions: jest.fn().mockResolvedValue({
      rp: { name: 'MetaMask' },
      user: { id: 'AQ', name: 'MetaMask User', displayName: 'MetaMask' },
      challenge: 'AQ',
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      extensions: { prf: { eval: { first: 'AQ' } } },
    }),
    protectVaultKeyWithPasskey: jest.fn().mockResolvedValue(undefined),
    generatePasskeyPostRegistrationAuthenticationOptions: jest
      .fn()
      .mockResolvedValue({
        challenge: 'post-reg-challenge',
        allowCredentials: [],
      }),
    forceUpdateMetamaskState: jest.fn().mockResolvedValue(undefined),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const testPasskeyRecord = {
  credential: { id: 'AQ', publicKey: 'AQ', counter: 0, transports: [] },
  encryptedVaultKey: { ciphertext: 'AQ', iv: 'AQ' },
  keyDerivation: { method: 'prf' as const, prfSalt: 'AQ' },
};

/**
 * Real app store with a partial metamask slice (merged with reducer initialState).
 * Same pattern as renderHookWithProvider + UPDATE_METAMASK_STATE in usePerpsMarketInfo.test.ts.
 * @param firstTimeFlowType
 * @param metamaskOverrides
 */
const buildMockStore = (
  firstTimeFlowType: FirstTimeFlowType,
  metamaskOverrides: Record<string, unknown> = {},
) =>
  configureStore({
    metamask: {
      firstTimeFlowType,
      participateInMetaMetrics: null,
      ...metamaskOverrides,
    },
  });

const PASSKEY_LABEL_BIOMETRICS = tEn('passkeyAuthMethodBiometrics');

describe('SetupPasskey', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(startPasskeyRegistration).mockClear();
    jest.mocked(startPasskeyAuthentication).mockClear();
    jest.mocked(protectVaultKeyWithPasskey).mockClear();
    jest.mocked(generatePasskeyRegistrationOptions).mockClear();
    jest
      .mocked(generatePasskeyPostRegistrationAuthenticationOptions)
      .mockClear();
    jest.mocked(forceUpdateMetamaskState).mockReset();
    jest.mocked(forceUpdateMetamaskState).mockResolvedValue(undefined);
    jest.mocked(startPasskeyRegistration).mockResolvedValue({
      id: 'AQ',
      rawId: 'AQ',
      type: 'public-key',
      response: {
        clientDataJSON: 'e30',
        attestationObject: 'e30',
      },
      clientExtensionResults: {},
    });
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(mockAuthenticationResponse);
  });

  function renderSetupPasskey(mockStore: ReturnType<typeof buildMockStore>) {
    return renderWithProvider(<SetupPasskey />, mockStore, '/', render);
  }

  function renderSetupPasskeyContent(
    mockStore: ReturnType<typeof buildMockStore>,
    onNext = jest.fn(),
  ) {
    return {
      onNext,
      ...renderWithProvider(
        <SetupPasskeyContent onNext={onNext} />,
        mockStore,
        '/',
        render,
      ),
    };
  }

  it('renders core passkey setup actions', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    renderSetupPasskey(mockStore);

    expect(screen.getByTestId('passkey-set-up-button')).toBeInTheDocument();
    expect(
      screen.getByTestId('passkey-maybe-later-button'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('passkey-enrollment-error'),
    ).not.toBeInTheDocument();
  });

  it('renders the heading text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderSetupPasskey(mockStore);

    expect(
      getByText(tEn('unlockWithPasskey', [PASSKEY_LABEL_BIOMETRICS])),
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderSetupPasskey(mockStore);

    expect(
      getByText(tEn('passkeyDescription', [PASSKEY_LABEL_BIOMETRICS])),
    ).toBeInTheDocument();
  });

  it('renders the set up biometrics button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderSetupPasskey(mockStore);

    expect(
      getByText(tEn('setUpPasskey', [PASSKEY_LABEL_BIOMETRICS])),
    ).toBeInTheDocument();
  });

  it('renders the maybe later button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderSetupPasskey(mockStore);

    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
  });

  it('renders the biometrics image', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByAltText } = renderSetupPasskey(mockStore);

    expect(getByAltText('Biometrics')).toBeInTheDocument();
  });

  describe('maybe later navigation', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('navigates to SRP review route when flow type is create', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByText } = renderSetupPasskey(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to MetaMetrics route when flow type is import on non-Firefox and metrics unset', () => {
      jest
        .spyOn(BrowserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      const mockStore = buildMockStore(FirstTimeFlowType.import);
      const { getByText } = renderSetupPasskey(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
    });

    it('navigates to completion when flow type is import on Firefox', () => {
      jest
        .spyOn(BrowserRuntimeUtils, 'getBrowserName')
        .mockReturnValue(PLATFORM_FIREFOX);
      const mockStore = buildMockStore(FirstTimeFlowType.import);
      const { getByText } = renderSetupPasskey(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to completion when flow type is import and metrics preference is set', () => {
      jest
        .spyOn(BrowserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      const mockStore = buildMockStore(FirstTimeFlowType.import, {
        participateInMetaMetrics: true,
      });
      const { getByText } = renderSetupPasskey(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to completion when flow type is socialCreate', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.socialCreate);
      const { getByText } = renderSetupPasskey(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('calls onNext when maybe later is clicked in the reusable content', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.restore);
      const { getByText, onNext } = renderSetupPasskeyContent(mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('set up biometrics', () => {
    it('shows step checklist while registering and verifying, then navigates', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      jest
        .mocked(forceUpdateMetamaskState)
        .mockImplementation(async (dispatch) => {
          dispatch({
            type: UPDATE_METAMASK_STATE,
            value: { passkeyRecord: testPasskeyRecord },
          });
        });
      const { getByTestId } = renderSetupPasskey(mockStore);

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(screen.getByTestId('passkey-setup-steps')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          generatePasskeyPostRegistrationAuthenticationOptions,
        ).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(protectVaultKeyWithPasskey).toHaveBeenCalled();
      });
      expect(forceUpdateMetamaskState).toHaveBeenCalled();
      await waitFor(
        () => {
          expect(mockUseNavigate).toHaveBeenCalledWith(
            ONBOARDING_REVIEW_SRP_ROUTE,
            {
              replace: true,
            },
          );
        },
        { timeout: 4000 },
      );
    });

    it('shows primary actions again when the user cancels passkey registration', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderSetupPasskey(mockStore);

      jest
        .mocked(startPasskeyRegistration)
        .mockRejectedValueOnce(
          new DOMException('User cancelled', 'NotAllowedError'),
        );

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(startPasskeyRegistration).toHaveBeenCalled();
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('passkey-enrollment-error'),
      ).not.toBeInTheDocument();
      await waitFor(() => {
        expect(getByTestId('passkey-set-up-button')).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('passkey-setup-steps'),
      ).not.toBeInTheDocument();
    });

    it('shows primary actions again when the user cancels post-registration authentication', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderSetupPasskey(mockStore);

      jest
        .mocked(startPasskeyAuthentication)
        .mockRejectedValueOnce(
          new DOMException('User cancelled', 'NotAllowedError'),
        );

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(startPasskeyRegistration).toHaveBeenCalled();
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(getByTestId('passkey-set-up-button')).toBeInTheDocument();
      });
    });

    it('redirects away when passkey is already registered', async () => {
      jest
        .spyOn(BrowserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      const mockStore = buildMockStore(FirstTimeFlowType.create, {
        passkeyRecord: testPasskeyRecord,
      });
      renderSetupPasskey(mockStore);

      expect(
        screen.queryByTestId('passkey-set-up-button'),
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_REVIEW_SRP_ROUTE,
          { replace: true },
        );
      });

      expect(startPasskeyRegistration).not.toHaveBeenCalled();
    });

    it('shows an inline error when protecting the vault key with the passkey fails', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderSetupPasskey(mockStore);

      jest.mocked(protectVaultKeyWithPasskey).mockRejectedValueOnce({
        code: PasskeyControllerErrorCode.RegistrationVerificationFailed,
      });

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('passkey-enrollment-error'),
        ).toHaveTextContent(
          tEn('passkeyErrorRegistrationVerificationFailed', [
            PASSKEY_LABEL_BIOMETRICS,
          ]),
        );
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('shows registration error when protectVaultKeyWithPasskey fails after post-registration auth', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderSetupPasskey(mockStore);

      jest.mocked(protectVaultKeyWithPasskey).mockRejectedValueOnce({
        code: PasskeyControllerErrorCode.AuthenticationVerificationFailed,
      });

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('passkey-enrollment-error'),
        ).toHaveTextContent(
          tEn('passkeyErrorAuthenticationVerificationFailed', [
            PASSKEY_LABEL_BIOMETRICS,
          ]),
        );
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('calls onNext after successful enrollment in the reusable content', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.restore);
      jest
        .mocked(forceUpdateMetamaskState)
        .mockImplementation(async (dispatch) => {
          dispatch({
            type: UPDATE_METAMASK_STATE,
            value: { passkeyRecord: testPasskeyRecord },
          });
        });

      const { getByTestId, onNext } = renderSetupPasskeyContent(mockStore);

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(
        () => {
          expect(onNext).toHaveBeenCalledTimes(1);
        },
        { timeout: 4000 },
      );
    });
  });
});
