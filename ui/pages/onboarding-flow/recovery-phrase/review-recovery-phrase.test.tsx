import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  MANAGE_WALLET_RECOVERY_ROUTE,
} from '../../../helpers/constants/routes';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import * as Actions from '../../../store/actions';
import RecoveryPhrase from './review-recovery-phrase';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

jest.mock('../../../hooks/useIsFirefox', () => ({
  useIsFirefox: jest.fn().mockReturnValue(false),
}));

const { useIsFirefox } = jest.requireMock('../../../hooks/useIsFirefox');

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

const mockStore = configureMockStore()(mockState);

describe('Review Recovery Phrase Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      search: '',
    });
  });

  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

  const props = {
    secretRecoveryPhrase: TEST_SEED,
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should redirect to onboarding metametrics page if seed phrase is already backed up', () => {
    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });
    renderWithProvider(<RecoveryPhrase {...props} />, store);

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('should match snapshot after reveal recovery button is clicked', () => {
    const { container, queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton as HTMLElement);

    expect(container).toMatchSnapshot();
  });

  it('should reveal seed after clicking reveal button', () => {
    const { queryByText, queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');
    const revealButton = queryByText(messages.tapToReveal.message);

    fireEvent.click(revealRecoveryPhraseButton as HTMLElement);

    expect(revealButton).not.toBeInTheDocument();
  });

  it('should click next after revealing seed phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton as HTMLElement);

    const nextButton = queryByTestId('recovery-phrase-continue');

    fireEvent.click(nextButton as HTMLElement);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: '',
    });
  });

  it('should route to url with reminder parameter', () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true',
    });

    const isReminderParam = '?isFromReminder=true';
    const { queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton as HTMLElement);

    const nextButton = queryByTestId('recovery-phrase-continue');

    fireEvent.click(nextButton as HTMLElement);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: isReminderParam,
    });
  });

  it('renders match snapshot when isFromReminder and isFromSettingsSecurity are present in the search params', () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const { container } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should navigate to reveal SRP route when back button is clicked', () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const { getByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const backButton = getByTestId('reveal-recovery-phrase-review-back-button');

    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ONBOARDING_REVEAL_SRP_ROUTE}?isFromReminder=true&isFromSettingsSecurity=true`,
      { replace: true },
    );
  });

  it('should open the SRP details modal when the SRP details link is clicked', () => {
    const { getAllByText, queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    // The link appears as interpolated text inside seedPhraseReviewDetails
    const srpDetailsLinks = getAllByText(messages.secretRecoveryPhrase.message);
    fireEvent.click(srpDetailsLinks[0]);

    expect(queryByTestId('srp-details-modal')).toBeInTheDocument();
  });

  it('should navigate to metametrics page when remind later is clicked', async () => {
    jest
      .spyOn(Actions, 'setSeedPhraseBackedUp')
      .mockReturnValue(jest.fn().mockResolvedValue(null));

    const store = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      store,
    );

    const remindLaterButton = getByTestId('recovery-phrase-remind-later');
    fireEvent.click(remindLaterButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
    });
  });

  it('should navigate to completion route on remind later when running on Firefox', async () => {
    jest.mocked(useIsFirefox).mockReturnValue(true);
    jest
      .spyOn(Actions, 'setSeedPhraseBackedUp')
      .mockReturnValue(jest.fn().mockResolvedValue(null));

    const store = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      store,
    );

    const remindLaterButton = getByTestId('recovery-phrase-remind-later');
    fireEvent.click(remindLaterButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('should navigate to completion route on remind later when firstTimeFlowType is restore', async () => {
    jest
      .spyOn(Actions, 'setSeedPhraseBackedUp')
      .mockReturnValue(jest.fn().mockResolvedValue(null));

    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.restore,
      },
    });
    const { getByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      store,
    );

    const remindLaterButton = getByTestId('recovery-phrase-remind-later');
    fireEvent.click(remindLaterButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('onClose should navigate to reveal srp list route', () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const { getByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const closeButton = getByTestId(
      'reveal-recovery-phrase-review-close-button',
    );

    fireEvent.click(closeButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(MANAGE_WALLET_RECOVERY_ROUTE, {
      replace: true,
    });
  });
});
