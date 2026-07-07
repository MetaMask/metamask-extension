import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { getMockConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { ScamQuestionnaire } from './scam-questionnaire';

jest.mock('./useScamQuestionnaireMetrics', () => ({
  useScamQuestionnaireMetrics: () => ({
    trackStarted: jest.fn(),
    trackQuestionAnswered: jest.fn(),
    trackCompletedClean: jest.fn(),
    trackDismissed: jest.fn(),
    trackWarningShown: jest.fn(),
    trackWarningStopped: jest.fn(),
    trackWarningContactSupport: jest.fn(),
    trackWarningProceeded: jest.fn(),
  }),
}));

function render(props = {}) {
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

describe('ScamQuestionnaire', () => {
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
    answer(getByTestId, 'q1_yes');
    answer(getByTestId, 'q2_goods');
    answer(getByTestId, 'q3_no');
    expect(getByTestId('scam-warning-stop')).toBeInTheDocument();
    expect(handlers.onCleanPass).not.toHaveBeenCalled();
  });

  it('calls onReject from the warning "Stop this payment" action', () => {
    const { getByTestId, handlers } = render();
    answer(getByTestId, 'q1_yes');
    answer(getByTestId, 'q2_goods');
    answer(getByTestId, 'q3_no');
    fireEvent.click(getByTestId('scam-warning-stop'));
    expect(handlers.onReject).toHaveBeenCalledTimes(1);
  });
});
