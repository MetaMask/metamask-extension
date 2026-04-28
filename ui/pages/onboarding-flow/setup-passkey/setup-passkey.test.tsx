import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
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
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import { startPasskeyRegistration } from '../../../../shared/lib/passkey';
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
}));

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
    forceUpdateMetamaskState: jest.fn().mockResolvedValue(undefined),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const buildMockStore = (
  firstTimeFlowType: FirstTimeFlowType,
  metamaskOverrides: Record<string, unknown> = {},
) =>
  configureMockStore([thunk])({
    metamask: {
      firstTimeFlowType,
      participateInMetaMetrics: null,
      ...metamaskOverrides,
    },
  });

describe('SetupPasskey', () => {
  it('redirects to next route when passkey is already registered', async () => {
    jest.spyOn(BrowserRuntimeUtils, 'getBrowserName').mockReturnValue('chrome');
    const mockStore = buildMockStore(FirstTimeFlowType.create, {
      passkeyRecord: {
        credential: { id: 'AQ', publicKey: 'AQ', counter: 0, transports: [] },
        encryptedVaultKey: { ciphertext: 'AQ', iv: 'AQ' },
        keyDerivation: { method: 'prf' as const, prfSalt: 'AQ' },
      },
    });
    renderWithProvider(<SetupPasskey />, mockStore);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });
  });

  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(protectVaultKeyWithPasskey).mockClear();
    jest.mocked(generatePasskeyRegistrationOptions).mockClear();
    jest.mocked(forceUpdateMetamaskState).mockClear();
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
    it('completes passkey registration using background encryption key and navigates', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(<SetupPasskey />, mockStore);

      fireEvent.click(getByTestId('passkey-set-up-button'));

      await waitFor(() => {
        expect(protectVaultKeyWithPasskey).toHaveBeenCalled();
      });
      expect(forceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('does not navigate when the user cancels passkey registration', async () => {
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
  });
});
