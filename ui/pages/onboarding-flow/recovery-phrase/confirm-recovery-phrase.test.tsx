import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  MANAGE_WALLET_RECOVERY_ROUTE,
} from '../../../helpers/constants/routes';
import * as BrowserRuntimeUtils from '../../../../shared/lib/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import ConfirmRecoveryPhrase from './confirm-recovery-phrase';

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

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setSeedPhraseBackedUp: jest.fn().mockReturnValue(jest.fn()),
}));

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

// click and answer the srp quiz
const clickAndAnswerSrpQuiz = (quizUnansweredChips: HTMLElement[]) => {
  // sort the unanswered chips by testId
  const sortedQuizWords = quizUnansweredChips
    .map((chipElm: HTMLElement) => {
      // extract the testId number from the data-testid attribute, sample testId -> recovery-phrase-quiz-unanswered-[number]
      const testIdNumber = chipElm?.getAttribute('data-testid')?.split('-')[4];
      return {
        id: Number(testIdNumber),
        elm: chipElm,
      };
    })
    .sort((a, b) => a.id - b.id);

  sortedQuizWords.forEach((word) => {
    // assert the unanswered chip is in the document
    expect(word.elm).toBeInTheDocument();
    fireEvent.click(word.elm);
  });
};

describe('Confirm Recovery Phrase Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      search: '',
    });
  });

  const TEST_SEED =
    'debris dizzy just just just float just just just just speak just';

  const props = {
    secretRecoveryPhrase: TEST_SEED,
  };

  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
          },
        },
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  it('should redirect to onboarding metametrics page if seed phrase is already backed up', () => {
    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });
    renderWithProvider(<ConfirmRecoveryPhrase {...props} />, store);

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('should have 3 recovery phrase inputs', () => {
    const { queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    expect(queryAllByTestId(/recovery-phrase-quiz-unanswered/u)).toHaveLength(
      3,
    );
  });

  it('does not show the confirm modal when words are still missing', () => {
    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    fireEvent.click(recoveryPhraseInputs[0]);
    fireEvent.click(recoveryPhraseInputs[1]);

    expect(queryByTestId('confirm-srp-modal')).not.toBeInTheDocument();
    expect(queryByTestId('recovery-phrase-confirm')).not.toBeInTheDocument();
  });

  it('shows the success modal automatically after selecting all quiz words', () => {
    const { queryByTestId, queryAllByTestId, getByText } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const quizUnansweredChips = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    clickAndAnswerSrpQuiz(quizUnansweredChips);

    expect(queryByTestId('confirm-srp-modal')).toBeInTheDocument();
    expect(queryByTestId('recovery-phrase-confirm')).not.toBeInTheDocument();

    const gotItButton = getByText(messages.gotIt.message);
    expect(gotItButton).toBeInTheDocument();
    fireEvent.click(gotItButton);

    expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('should go to Onboarding Completion page as a next step in firefox', async () => {
    jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { queryAllByTestId, getByText } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const quizUnansweredChips = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    clickAndAnswerSrpQuiz(quizUnansweredChips);

    fireEvent.click(getByText(messages.gotIt.message));

    expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
  });

  it('onClose should navigate to reveal srp list route', () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const { getByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const closeButton = getByTestId(
      'reveal-recovery-phrase-confirm-close-button',
    );

    fireEvent.click(closeButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(MANAGE_WALLET_RECOVERY_ROUTE, {
      replace: true,
    });
  });
});
