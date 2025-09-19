import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ONBOARDING_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import RecoveryPhrase from './review-recovery-phrase';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockStore = configureMockStore()({
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
});

describe('Review Recovery Phrase Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
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

  it('should match snapshot after reveal recovery button is clicked', () => {
    const { container, queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton);

    expect(container).toMatchSnapshot();
  });

  it('should reveal seed after clicking reveal button', () => {
    const { queryByText, queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');
    const revealButton = queryByText('Tap to reveal');

    fireEvent.click(revealRecoveryPhraseButton);

    expect(revealButton).not.toBeInTheDocument();
  });

  it('should click next after revealing seed phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton);

    const nextButton = queryByTestId('recovery-phrase-continue');

    fireEvent.click(nextButton);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: '',
    });
  });

  it('should route to url with reminder parameter', () => {
    const isReminderParam = '?isFromReminder=true';
    const { queryByTestId } = renderWithProvider(
      <RecoveryPhrase {...props} />,
      mockStore,
      isReminderParam,
    );

    const revealRecoveryPhraseButton = queryByTestId('recovery-phrase-reveal');

    fireEvent.click(revealRecoveryPhraseButton);

    const nextButton = queryByTestId('recovery-phrase-continue');

    fireEvent.click(nextButton);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: isReminderParam,
    });
  });
});
