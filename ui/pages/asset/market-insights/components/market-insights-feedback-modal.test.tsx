import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import { MarketInsightsFeedbackReason } from '../../../../../shared/constants/market-insights-events';
import {
  MarketInsightsFeedbackModal,
  MARKET_INSIGHTS_FEEDBACK_MODAL_TEST_ID,
} from './market-insights-feedback-modal';

const FEEDBACK_OPTION_TEST_IDS = {
  NotRelevant: 'market-insights-feedback-option-not-relevant',
  NotAccurate: 'market-insights-feedback-option-not-accurate',
  HardToUnderstand: 'market-insights-feedback-option-hard-to-understand',
  HarmfulOrOffensive: 'market-insights-feedback-option-harmful-or-offensive',
  SomethingElse: 'market-insights-feedback-option-something-else',
} as const;

const ADDITIONAL_INPUT_TEST_ID = 'market-insights-feedback-additional-input';
const SUBMIT_BUTTON_TEST_ID = 'market-insights-feedback-submit-button';

const en = enLocale as unknown as Record<string, { message: string }>;
const charactersRemaining = (count: number) =>
  (en.marketInsightsFeedbackCharactersRemaining.message as string).replace(
    '$1',
    String(count),
  );

const renderFeedbackModal = ({
  onSubmit = jest.fn(),
  onClose = jest.fn(),
}: {
  onSubmit?: (payload: {
    reason: MarketInsightsFeedbackReason;
    feedbackText?: string;
  }) => void;
  onClose?: () => void;
} = {}) =>
  renderWithProvider(
    <MarketInsightsFeedbackModal onClose={onClose} onSubmit={onSubmit} />,
  );

describe('MarketInsightsFeedbackModal', () => {
  it('renders the modal with all feedback options', () => {
    const { getByText, getByTestId } = renderFeedbackModal();

    expect(
      getByTestId(MARKET_INSIGHTS_FEEDBACK_MODAL_TEST_ID),
    ).toBeInTheDocument();
    expect(
      getByText(en.marketInsightsFeedbackDescription.message),
    ).toBeInTheDocument();
    Object.values(FEEDBACK_OPTION_TEST_IDS).forEach((testId) => {
      expect(getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('groups the native radios under the same name', () => {
    const { getAllByRole } = renderFeedbackModal();
    const radios = getAllByRole('radio');

    expect(radios).toHaveLength(5);
    const group = radios[0].getAttribute('name');
    expect(group).toBeTruthy();
    expect(new Set(radios.map((radio) => radio.getAttribute('name')))).toEqual(
      new Set([group]),
    );
  });

  it('disables submit until a reason is selected', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderFeedbackModal({ onSubmit });

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.NotRelevant));
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'not_relevant' });
  });

  it('requires free-text feedback for the something-else reason', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderFeedbackModal({ onSubmit });

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.SomethingElse));

    const additionalInput = getByTestId(ADDITIONAL_INPUT_TEST_ID);
    expect(additionalInput).toHaveAccessibleName(
      en.marketInsightsFeedbackAdditionalLabel.message,
    );
    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);

    expect(submitButton).toBeDisabled();

    fireEvent.change(additionalInput, { target: { value: 'Add price data' } });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'something_else',
      feedbackText: 'Add price data',
    });
  });

  it('hides the free-text field until something else is selected', () => {
    const { getByTestId, queryByTestId } = renderFeedbackModal();

    expect(queryByTestId(ADDITIONAL_INPUT_TEST_ID)).not.toBeInTheDocument();

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.SomethingElse));

    expect(getByTestId(ADDITIONAL_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it('clears the free-text field when switching to another reason', () => {
    const { getByTestId, queryByTestId } = renderFeedbackModal();

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.SomethingElse));
    fireEvent.change(getByTestId(ADDITIONAL_INPUT_TEST_ID), {
      target: { value: 'Some text' },
    });
    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.NotRelevant));

    expect(queryByTestId(ADDITIONAL_INPUT_TEST_ID)).not.toBeInTheDocument();

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.SomethingElse));
    expect(getByTestId(ADDITIONAL_INPUT_TEST_ID)).toHaveValue('');
  });

  it('shows the remaining character count while typing', () => {
    const { getByTestId, getByText } = renderFeedbackModal();

    fireEvent.click(getByTestId(FEEDBACK_OPTION_TEST_IDS.SomethingElse));
    expect(getByText(charactersRemaining(255))).toBeInTheDocument();

    fireEvent.change(getByTestId(ADDITIONAL_INPUT_TEST_ID), {
      target: { value: '12345' },
    });
    expect(getByText(charactersRemaining(250))).toBeInTheDocument();
  });

  it('marks the selected reason as checked', () => {
    const { getByTestId } = renderFeedbackModal();

    const option = getByTestId(FEEDBACK_OPTION_TEST_IDS.HardToUnderstand);
    expect(option).not.toBeChecked();

    fireEvent.click(option);

    expect(option).toBeChecked();
  });

  it('calls onClose when the modal close button is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderFeedbackModal({ onClose });

    fireEvent.click(getByLabelText(en.close.message as string));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
