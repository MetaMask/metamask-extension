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
import { completePasskeyEnrollment } from '../../../store/actions';
import Biometrics from './biometrics';

jest.mock('@metamask/passkey-controller', () => ({
  prepareCreationParams: jest.fn(() => ({
    prfSalt: new Uint8Array(32),
    userHandle: new Uint8Array(16),
  })),
}));

jest.mock(
  '../../../../shared/lib/passkey/PasskeyCeremonyExtensionAdapter',
  () => ({
    PasskeyCeremonyExtensionAdapter: jest.fn().mockImplementation(() => ({
      createCredential: jest.fn().mockResolvedValue({
        credentialId: new Uint8Array([1, 2, 3]),
        userHandle: new Uint8Array([4, 5, 6]),
        prfEnabled: true,
      }),
    })),
  }),
);

jest.mock('../../../store/actions', () => {
  const actual = jest.requireActual('../../../store/actions');
  return {
    ...actual,
    completePasskeyEnrollment: jest.fn().mockResolvedValue(undefined),
  };
});

const mockUseNavigate = jest.fn();
const mockClearVaultPassword = jest.fn();

const defaultBiometricsProps = {
  getVaultPassword: () => 'vault-password-test',
  clearVaultPassword: mockClearVaultPassword,
};

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
    mockClearVaultPassword.mockClear();
    jest.mocked(completePasskeyEnrollment).mockClear();
  });

  it('renders and matches snapshot', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { container } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders the heading text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(
      getByText(messages.unlockWithBiometrics.message),
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(
      getByText(messages.biometricsDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the set up biometrics button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(getByText(messages.setUpBiometrics.message)).toBeInTheDocument();
  });

  it('renders the maybe later button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
  });

  it('renders the biometrics image', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByAltText } = renderWithProvider(
      <Biometrics {...defaultBiometricsProps} />,
      mockStore,
    );

    expect(getByAltText('Biometrics')).toBeInTheDocument();
  });

  describe('maybe later navigation', () => {
    it('navigates to SRP review route when flow type is create', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByText } = renderWithProvider(
        <Biometrics {...defaultBiometricsProps} />,
        mockStore,
      );

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockClearVaultPassword).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to MetaMetrics route when flow type is import', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.import);
      const { getByText } = renderWithProvider(
        <Biometrics {...defaultBiometricsProps} />,
        mockStore,
      );

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockClearVaultPassword).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
    });
  });

  describe('set up biometrics', () => {
    it('stores passkey record and navigates when vault password is available', async () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(
        <Biometrics {...defaultBiometricsProps} />,
        mockStore,
      );

      fireEvent.click(getByTestId('biometrics-set-up-button'));

      await waitFor(() => {
        expect(completePasskeyEnrollment).toHaveBeenCalled();
      });
      expect(mockClearVaultPassword).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('skips enrollment and navigates when vault password is missing', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByTestId } = renderWithProvider(
        <Biometrics
          getVaultPassword={() => null}
          clearVaultPassword={mockClearVaultPassword}
        />,
        mockStore,
      );

      fireEvent.click(getByTestId('biometrics-set-up-button'));

      expect(completePasskeyEnrollment).not.toHaveBeenCalled();
      expect(mockClearVaultPassword).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });
  });
});
