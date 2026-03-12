import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import { getSeedPhrase } from '../../../store/actions';
import * as BrowserRuntimeUtils from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import RevealRecoveryPhrase from './reveal-recovery-phrase';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getSeedPhrase: jest.fn(),
}));

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
}));

const mockGetSeedPhrase = getSeedPhrase as jest.Mock;

const mockState = {
  metamask: {
    internalAccounts: {
      accounts: {
        accountId: {
          address: '0x0000000000000000000000000000000000000000',
          metadata: {
            keyring: 'HD Key Tree',
          },
        },
      },
      selectedAccount: 'accountId',
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0000000000000000000000000000000000000000'],
      },
    ],
  },
};

describe('RevealRecoveryPhrase', () => {
  const mockSetSecretRecoveryPhrase = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ search: '' });
  });

  it('renders the component with heading and form', () => {
    const mockStore = configureMockStore()(mockState);
    const { getByTestId, getByText } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    expect(getByTestId('reveal-recovery-phrase')).toBeInTheDocument();
    expect(getByText('Back up Secret Recovery Phrase')).toBeInTheDocument();
    expect(getByText('Enter password to continue')).toBeInTheDocument();
    expect(getByTestId('reveal-recovery-phrase-continue')).toBeInTheDocument();
  });

  it('redirects to metametrics page when seed phrase is already backed up', () => {
    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });

    renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      store,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('redirects to completion page on Firefox when seed phrase is already backed up', () => {
    jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });

    renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      store,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
  });

  it('updates password state on input change', () => {
    const mockStore = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    expect(passwordInput.value).toBe('testpassword');
  });

  it('navigates to review SRP route on successful password submission', async () => {
    const mockSeedPhrase = 'test seed phrase words here';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockGetSeedPhrase).toHaveBeenCalledWith('');
      expect(mockSetSecretRecoveryPhrase).toHaveBeenCalledWith(mockSeedPhrase);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        { replace: true },
      );
    });
  });

  it('shows error message on incorrect password', async () => {
    mockGetSeedPhrase.mockRejectedValue(new Error('Incorrect password'));

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container, findByText } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    const errorMessage = await findByText(
      'Password is incorrect. Please try again.',
    );
    expect(errorMessage).toBeInTheDocument();
  });

  it('clears error when user types after incorrect password', async () => {
    mockGetSeedPhrase.mockRejectedValue(new Error('Incorrect password'));

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container, findByText, queryByText } =
      renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await findByText('Password is incorrect. Please try again.');

    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(
      queryByText('Password is incorrect. Please try again.'),
    ).not.toBeInTheDocument();
  });

  it('submits password via form submit', async () => {
    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockGetSeedPhrase).toHaveBeenCalledWith('correctpassword');
      expect(mockSetSecretRecoveryPhrase).toHaveBeenCalledWith(mockSeedPhrase);
    });
  });

  it('passes query params to the review SRP route', async () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true',
    });

    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${ONBOARDING_REVIEW_SRP_ROUTE}?isFromReminder=true`,
        { replace: true },
      );
    });
  });

  it('passes both query params to the review SRP route', async () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${ONBOARDING_REVIEW_SRP_ROUTE}?isFromReminder=true&isFromSettingsSecurity=true`,
        { replace: true },
      );
    });
  });

  describe('returnToPreviousPage', () => {
    it('navigates to default route when not from settings security', () => {
      const mockStore = configureMockStore()(mockState);
      const { getByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

      const backButton = getByTestId('reveal-recovery-phrase-back-button');
      fireEvent.click(backButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });

    it('navigates to reveal SRP list route when from settings security', () => {
      mockUseLocation.mockReturnValue({
        search: '?isFromSettingsSecurity=true',
      });

      const mockStore = configureMockStore()(mockState);
      const { getByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

      const backButton = getByTestId('reveal-recovery-phrase-back-button');
      fireEvent.click(backButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(REVEAL_SRP_LIST_ROUTE, {
        replace: true,
      });
    });
  });
});
