import React from 'react';
import { fireEvent, waitFor, screen } from '@testing-library/react';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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
  generatePasskeyAuthenticationOptions,
  verifyPasskeyEnrollment,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import {
  startPasskeyRegistration,
  startPasskeyAuthentication,
} from '../../../../shared/lib/passkey';
import SetupPasskey from './setup-passkey';

jest.mock('../../../components/ui/icon/status-icon', () => ({
  StatusIcon: ({
    state,
    className,
  }: {
    state: 'loading' | 'success' | 'fail';
    className?: string;
  }) => (
    <span
      data-testid={`mock-status-icon-${state}`}
      className={className}
      aria-hidden
    />
  ),
}));

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
    generatePasskeyAuthenticationOptions: jest.fn().mockResolvedValue({
      challenge: 'AQ',
      allowCredentials: [],
    }),
    verifyPasskeyEnrollment: jest.fn().mockResolvedValue(undefined),
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

describe('SetupPasskey', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(startPasskeyRegistration).mockClear();
    jest.mocked(startPasskeyAuthentication).mockClear();
    jest.mocked(protectVaultKeyWithPasskey).mockClear();
    jest.mocked(generatePasskeyRegistrationOptions).mockClear();
    jest.mocked(generatePasskeyAuthenticationOptions).mockClear();
    jest.mocked(verifyPasskeyEnrollment).mockClear();
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

  it('renders core passkey setup actions', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    renderWithProvider(<SetupPasskey />, mockStore);

    expect(screen.getByTestId('passkey-set-up-button')).toBeInTheDocument();
    expect(
      screen.getByTestId('passkey-maybe-later-button'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('passkey-registration-error'),
    ).not.toBeInTheDocument();
  });

  it('renders the heading text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

    expect(getByText(messages.unlockWithPasskey.message)).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

    expect(getByText(messages.passkeyDescription.message)).toBeInTheDocument();
  });

  it('renders the set up biometrics button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

    expect(getByText(messages.setUpPasskey.message)).toBeInTheDocument();
  });

  it('renders the maybe later button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
  });

  it('renders the biometrics image', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByAltText } = renderWithProvider(<SetupPasskey />, mockStore);

    expect(getByAltText('Biometrics')).toBeInTheDocument();
  });

  describe('maybe later navigation', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('navigates to SRP review route when flow type is create', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

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
      const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

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
      const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

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
      const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to MetaMetrics when flow type is not create or import', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.socialCreate);
      const { getByText } = renderWithProvider(<SetupPasskey />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
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
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(screen.getByTestId('passkey-setup-steps')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(protectVaultKeyWithPasskey).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(verifyPasskeyEnrollment).toHaveBeenCalledWith(
          mockAuthenticationResponse,
        );
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
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

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
        screen.queryByTestId('passkey-registration-error'),
      ).not.toBeInTheDocument();
      await waitFor(() => {
        expect(getByTestId('passkey-set-up-button')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('passkey-setup-steps')).not.toBeInTheDocument();
    });

    it('shows primary actions again when the user cancels passkey verification', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      jest
        .mocked(startPasskeyAuthentication)
        .mockRejectedValueOnce(
          new DOMException('User cancelled', 'NotAllowedError'),
        );

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(verifyPasskeyEnrollment).not.toHaveBeenCalled();
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(getByTestId('passkey-set-up-button')).toBeInTheDocument();
      });
    });

    it('uses verify-only flow when passkey is already registered', async () => {
      jest.spyOn(BrowserRuntimeUtils, 'getBrowserName').mockReturnValue('chrome');
      const mockStore = buildMockStore(FirstTimeFlowType.create, {
        passkeyRecord: testPasskeyRecord,
      });
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      expect(
        screen.getByText(messages.passkeySetupStepVerify.message),
      ).toBeInTheDocument();

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(startPasskeyRegistration).not.toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(verifyPasskeyEnrollment).toHaveBeenCalled();
      });
      await waitFor(
        () => {
          expect(mockUseNavigate).toHaveBeenCalledWith(
            ONBOARDING_REVIEW_SRP_ROUTE,
            { replace: true },
          );
        },
        { timeout: 4000 },
      );
    });

    it('shows an inline error when protecting the vault key with the passkey fails', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      jest.mocked(protectVaultKeyWithPasskey).mockRejectedValueOnce({
        code: PasskeyControllerErrorCode.RegistrationVerificationFailed,
      });

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('passkey-registration-error'),
        ).toHaveTextContent(
          messages.passkeyErrorRegistrationVerificationFailed.message,
        );
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('shows verification error when verifyPasskeyEnrollment fails', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      jest.mocked(verifyPasskeyEnrollment).mockRejectedValueOnce({
        code: PasskeyControllerErrorCode.AuthenticationVerificationFailed,
      });

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('passkey-verification-error'),
        ).toHaveTextContent(
          messages.passkeyErrorAuthenticationVerificationFailed.message,
        );
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });
});
