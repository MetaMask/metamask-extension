// The global `it` resolves to Mocha's typings, which lack `each`.
import { it } from '@jest/globals';
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { getMockConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { PROCEED_DELAY_SECONDS } from './scam-questionnaire.constants';
import { ScamQuestionnaire } from './scam-questionnaire';

// A single stable object so `metrics` keeps a consistent identity across
// renders (matching the real hook's `useMemo`) and call history accumulates
// across a whole questionnaire session.
const mockMetrics = {
  trackViewed: jest.fn(),
  trackWarningDisplayed: jest.fn(),
  trackCompleted: jest.fn(),
  trackDismissed: jest.fn(),
};

jest.mock('./useScamQuestionnaireMetrics', () => ({
  useScamQuestionnaireMetrics: () => mockMetrics,
}));

function render(props = {}) {
  // `resetMocks` is off repo-wide, so clear before mounting — the mount itself
  // fires the first impression event.
  Object.values(mockMetrics).forEach((mock) => mock.mockClear());

  const handlers = {
    onCleanPass: jest.fn(),
    onReject: jest.fn(),
    onBypass: jest.fn(),
    onDismiss: jest.fn(),
    ...props,
  };
  const result = renderWithConfirmContextProvider(
    <ScamQuestionnaire {...handlers} />,
    configureStore(getMockConfirmState()),
  );
  return { ...result, handlers };
}

function answer(getByTestId: (id: string) => HTMLElement, optionKey: string) {
  fireEvent.click(getByTestId(`scam-questionnaire-option-${optionKey}`));
  fireEvent.click(getByTestId('scam-questionnaire-continue'));
}

/** Runs down the warning screen's countdown so "Proceed anyway" is clickable. */
function elapseProceedDelay() {
  for (let second = 0; second < PROCEED_DELAY_SECONDS; second++) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

/**
 * Answers all three questions, flagging Q1 so the warning screen shows.
 * @param getByTestId
 */
function reachWarning(getByTestId: (id: string) => HTMLElement) {
  answer(getByTestId, 'q1_yes');
  answer(getByTestId, 'q2_goods');
  answer(getByTestId, 'q3_no');
}

const WARNING_ANSWERS = {
  q1: expect.objectContaining({ key: 'q1_yes' }),
  q2: expect.objectContaining({ key: 'q2_goods' }),
  q3: expect.objectContaining({ key: 'q3_no' }),
};

describe('ScamQuestionnaire', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the first question', () => {
    const { getByText } = render();
    expect(
      getByText(messages.scamQuestionnaireQ1Title.message),
    ).toBeInTheDocument();
  });

  it('keeps Continue disabled until an option is selected', () => {
    const { getByTestId } = render();
    expect(getByTestId('scam-questionnaire-continue')).toBeDisabled();
    fireEvent.click(getByTestId('scam-questionnaire-option-q1_no'));
    expect(getByTestId('scam-questionnaire-continue')).not.toBeDisabled();
  });

  it('calls onCleanPass when all answers are non-red-flag', () => {
    const { getByTestId, handlers } = render();
    answer(getByTestId, 'q1_no');
    answer(getByTestId, 'q2_goods');
    answer(getByTestId, 'q3_no');
    expect(handlers.onCleanPass).toHaveBeenCalledTimes(1);
  });

  it('shows the scam warning when an answer is a red flag', () => {
    const { getByTestId, handlers } = render();
    reachWarning(getByTestId);
    expect(getByTestId('scam-warning-stop')).toBeInTheDocument();
    expect(handlers.onCleanPass).not.toHaveBeenCalled();
  });

  it('calls onReject from the warning "Stop this payment" action', () => {
    const { getByTestId, handlers } = render();
    reachWarning(getByTestId);
    fireEvent.click(getByTestId('scam-warning-stop'));
    expect(handlers.onReject).toHaveBeenCalledTimes(1);
  });

  describe('trackViewed', () => {
    it('fires for the first question when the modal mounts', () => {
      render();

      expect(mockMetrics.trackViewed).toHaveBeenCalledTimes(1);
      expect(mockMetrics.trackViewed).toHaveBeenCalledWith(0);
    });

    it('fires once for each question the user reaches', () => {
      const { getByTestId } = render();

      answer(getByTestId, 'q1_no');
      answer(getByTestId, 'q2_goods');

      expect(mockMetrics.trackViewed.mock.calls).toStrictEqual([[0], [1], [2]]);
    });

    it('does not fire again when the user returns to a question already viewed', () => {
      const { getByTestId } = render();
      answer(getByTestId, 'q1_no');

      fireEvent.click(getByTestId('scam-questionnaire-back'));

      expect(mockMetrics.trackViewed).toHaveBeenCalledTimes(2);
      expect(mockMetrics.trackViewed.mock.calls).toStrictEqual([[0], [1]]);
    });
  });

  describe('trackWarningDisplayed', () => {
    it('fires with the collected answers when the warning is reached', () => {
      const { getByTestId } = render();

      reachWarning(getByTestId);

      expect(mockMetrics.trackWarningDisplayed).toHaveBeenCalledTimes(1);
      expect(mockMetrics.trackWarningDisplayed).toHaveBeenCalledWith(
        WARNING_ANSWERS,
      );
    });

    it('does not fire again when the user returns to the warning', () => {
      const { getByTestId } = render();
      reachWarning(getByTestId);

      fireEvent.click(getByTestId('scam-questionnaire-back'));
      fireEvent.click(getByTestId('scam-questionnaire-continue'));

      expect(getByTestId('scam-warning-stop')).toBeInTheDocument();
      expect(mockMetrics.trackWarningDisplayed).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackCompleted', () => {
    it('fires with status "clean" when no answer is a red flag', () => {
      const { getByTestId } = render();

      answer(getByTestId, 'q1_no');
      answer(getByTestId, 'q2_goods');
      answer(getByTestId, 'q3_no');

      expect(mockMetrics.trackCompleted).toHaveBeenCalledTimes(1);
      expect(mockMetrics.trackCompleted).toHaveBeenCalledWith({
        status: 'clean',
        contactSupportClicked: false,
        answers: {
          q1: expect.objectContaining({ key: 'q1_no' }),
          q2: expect.objectContaining({ key: 'q2_goods' }),
          q3: expect.objectContaining({ key: 'q3_no' }),
        },
      });
    });

    it.each([
      { testId: 'scam-warning-stop', status: 'payment_stopped' },
      { testId: 'scam-warning-proceed', status: 'proceeded' },
    ])('fires with status "$status" from the warning', ({ testId, status }) => {
      jest.useFakeTimers();
      const { getByTestId } = render();
      reachWarning(getByTestId);
      elapseProceedDelay();

      fireEvent.click(getByTestId(testId));

      expect(mockMetrics.trackCompleted).toHaveBeenCalledTimes(1);
      expect(mockMetrics.trackCompleted).toHaveBeenCalledWith({
        status,
        contactSupportClicked: false,
        answers: WARNING_ANSWERS,
      });
    });

    it('reports contactSupportClicked when Contact Support was used first', () => {
      const { getByTestId } = render();
      reachWarning(getByTestId);

      fireEvent.click(getByTestId('scam-warning-contact-support'));
      fireEvent.click(getByTestId('scam-warning-stop'));

      expect(mockMetrics.trackCompleted).toHaveBeenCalledWith({
        status: 'payment_stopped',
        contactSupportClicked: true,
        answers: WARNING_ANSWERS,
      });
    });
  });

  describe('trackDismissed', () => {
    it('fires with the first step when the user backs out of Q1', () => {
      const { getByTestId } = render();

      fireEvent.click(getByTestId('scam-questionnaire-back'));

      expect(mockMetrics.trackDismissed).toHaveBeenCalledTimes(1);
      expect(mockMetrics.trackDismissed).toHaveBeenCalledWith({
        furthestStep: 0,
        contactSupportClicked: false,
        answers: {},
      });
    });

    it.each([
      { label: 'Q2', answersGiven: ['q1_yes'], furthestStep: 1 },
      { label: 'Q3', answersGiven: ['q1_yes', 'q2_goods'], furthestStep: 2 },
      {
        label: 'the warning',
        answersGiven: ['q1_yes', 'q2_goods', 'q3_no'],
        furthestStep: 3,
      },
    ])(
      'fires with the reached step when Escape is pressed on $label',
      ({ answersGiven, furthestStep }) => {
        const { getByTestId, getByRole } = render();
        answersGiven.forEach((optionKey) => answer(getByTestId, optionKey));

        fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

        expect(mockMetrics.trackDismissed).toHaveBeenCalledTimes(1);
        expect(mockMetrics.trackDismissed).toHaveBeenCalledWith(
          expect.objectContaining({ furthestStep }),
        );
      },
    );

    // Backtracking rewinds the reported step: a user who reached Q3 and
    // retreated to Q1 reports Q1, even though the Q2 answer still rides along
    // on the same event.
    it('reports the step quit from after the user backtracks', () => {
      const { getByTestId } = render();
      answer(getByTestId, 'q1_no');
      answer(getByTestId, 'q2_goods');

      // On Q3, then walk all the way back and quit from Q1.
      fireEvent.click(getByTestId('scam-questionnaire-back'));
      fireEvent.click(getByTestId('scam-questionnaire-back'));
      fireEvent.click(getByTestId('scam-questionnaire-back'));

      expect(mockMetrics.trackDismissed).toHaveBeenCalledWith(
        expect.objectContaining({ furthestStep: 0 }),
      );
    });

    it('reports the last question when dismissed after backing out of the warning', () => {
      const { getByTestId, getByRole } = render();
      reachWarning(getByTestId);

      fireEvent.click(getByTestId('scam-questionnaire-back'));
      fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

      expect(mockMetrics.trackDismissed).toHaveBeenCalledWith(
        expect.objectContaining({ furthestStep: 2 }),
      );
    });

    it('reports only the answers collected so far', () => {
      const { getByTestId, getByRole } = render();
      answer(getByTestId, 'q1_yes');

      fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

      // Q2 and Q3 are absent rather than present-and-empty; the hook maps the
      // gaps to `null` when it serialises them as event properties.
      expect(mockMetrics.trackDismissed).toHaveBeenCalledWith({
        furthestStep: 1,
        contactSupportClicked: false,
        answers: { q1: expect.objectContaining({ key: 'q1_yes' }) },
      });
    });

    it('reports contactSupportClicked when Contact Support was used first', () => {
      const { getByTestId, getByRole } = render();
      reachWarning(getByTestId);

      fireEvent.click(getByTestId('scam-warning-contact-support'));
      fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

      expect(mockMetrics.trackDismissed).toHaveBeenCalledWith(
        expect.objectContaining({ contactSupportClicked: true }),
      );
    });
  });
});
