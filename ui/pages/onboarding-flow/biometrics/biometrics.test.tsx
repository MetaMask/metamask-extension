import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import {
  completePasskeyRegistration,
  generatePasskeyRegistrationOptions,
} from '../../../store/actions';
import Biometrics from './biometrics';

jest.mock(
  '../../../../shared/lib/passkey/PasskeyCeremonyExtensionAdapter',
  () => ({
    PasskeyCeremonyExtensionAdapter: jest.fn().mockImplementation(() => ({
      startRegistration: jest.fn().mockResolvedValue({
        id: 'AQ',
        rawId: 'AQ',
        type: 'public-key',
        response: {
          clientDataJSON: 'e30',
          attestationObject: 'e30',
        },
      }),
    })),
  }),
);

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
    completePasskeyRegistration: jest.fn().mockResolvedValue(undefined),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const buildMockStore = (firstTimeFlowType: FirstTimeFlowType) =>
  configureMockStore([thunk])({
    metamask: {
      firstTimeFlowType,
    },
  });

describe('Biometrics', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(completePasskeyRegistration).mockClear();
    jest.mocked(generatePasskeyRegistrationOptions).mockClear();
  });

  it('renders and matches snapshot', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { container } = renderWithProvider(<Biometrics />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('renders the heading text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(
      getByText(messages.unlockWithBiometrics.message),
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(
      getByText(messages.biometricsDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the set up biometrics button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByText(messages.setUpBiometrics.message)).toBeInTheDocument();
  });

  it('renders the maybe later button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
  });

  it('renders the biometrics image', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByAltText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByAltText('Biometrics')).toBeInTheDocument();
  });

  describe('maybe later navigation', () => {
    it('navigates to SRP review route when flow type is create', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByText } = renderWithProvider(<Biometrics />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to MetaMetrics route when flow type is import', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.import);
      const { getByText } = renderWithProvider(<Biometrics />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
    });
  });

  describe('set up biometrics', () => {
    it('completes passkey registration using background encryption key and navigates', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(<Biometrics />, mockStore);

      fireEvent.click(getByTestId('biometrics-set-up-button'));

      await waitFor(() => {
        expect(completePasskeyRegistration).toHaveBeenCalled();
      });
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });
  });
});
