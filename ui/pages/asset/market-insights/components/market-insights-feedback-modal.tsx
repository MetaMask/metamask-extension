import React, { useCallback, useId, useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
  TextArea,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MarketInsightsFeedbackReason } from '../../../../../shared/constants/market-insights-events';

const MAX_FEEDBACK_LENGTH = 255;

export const MARKET_INSIGHTS_FEEDBACK_MODAL_TEST_ID =
  'market-insights-feedback-modal';

export type MarketInsightsFeedbackSubmitPayload = {
  reason: MarketInsightsFeedbackReason;
  feedbackText?: string;
};

type FeedbackOption = {
  reason: MarketInsightsFeedbackReason;
  labelKey: string;
  testId: string;
};

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    reason: MarketInsightsFeedbackReason.NotRelevant,
    labelKey: 'marketInsightsFeedbackNotRelevant',
    testId: 'market-insights-feedback-option-not-relevant',
  },
  {
    reason: MarketInsightsFeedbackReason.NotAccurate,
    labelKey: 'marketInsightsFeedbackNotAccurate',
    testId: 'market-insights-feedback-option-not-accurate',
  },
  {
    reason: MarketInsightsFeedbackReason.HardToUnderstand,
    labelKey: 'marketInsightsFeedbackHardToUnderstand',
    testId: 'market-insights-feedback-option-hard-to-understand',
  },
  {
    reason: MarketInsightsFeedbackReason.HarmfulOrOffensive,
    labelKey: 'marketInsightsFeedbackHarmfulOrOffensive',
    testId: 'market-insights-feedback-option-harmful-or-offensive',
  },
  {
    reason: MarketInsightsFeedbackReason.SomethingElse,
    labelKey: 'marketInsightsFeedbackSomethingElse',
    testId: 'market-insights-feedback-option-something-else',
  },
];

type MarketInsightsFeedbackModalProps = {
  /** Called when the modal is dismissed without submitting. */
  onClose: () => void;
  /** Called with the selected reason and optional free-text feedback. */
  onSubmit: (payload: MarketInsightsFeedbackSubmitPayload) => void;
};

/**
 * Modal asking why the insights were unhelpful: one of five canned reasons,
 * with free text required when "Something else" is chosen. Mounting the
 * component opens the modal; selection state resets on unmount.
 *
 * @param props - Component props.
 * @param props.onClose - Called when the modal is dismissed without submitting.
 * @param props.onSubmit - Called with the selected reason and optional text.
 * @returns The feedback modal.
 */
export const MarketInsightsFeedbackModal = ({
  onClose,
  onSubmit,
}: MarketInsightsFeedbackModalProps) => {
  const t = useI18nContext();
  const reasonGroupName = useId();
  const feedbackInputId = useId();
  const [selectedReason, setSelectedReason] =
    useState<MarketInsightsFeedbackReason | null>(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  const isSomethingElse =
    selectedReason === MarketInsightsFeedbackReason.SomethingElse;

  const trimmedFeedback = additionalFeedback.trim();

  const canSubmit =
    selectedReason !== null && (!isSomethingElse || trimmedFeedback.length > 0);

  const remainingChars = useMemo(
    () => MAX_FEEDBACK_LENGTH - additionalFeedback.length,
    [additionalFeedback],
  );

  const handleReasonPress = useCallback(
    (reason: MarketInsightsFeedbackReason) => {
      setSelectedReason(reason);
      if (reason !== MarketInsightsFeedbackReason.SomethingElse) {
        setAdditionalFeedback('');
      }
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit || selectedReason === null) {
      return;
    }

    onSubmit({
      reason: selectedReason,
      ...(isSomethingElse && trimmedFeedback
        ? { feedbackText: trimmedFeedback }
        : {}),
    });
  }, [canSubmit, selectedReason, isSomethingElse, trimmedFeedback, onSubmit]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid={MARKET_INSIGHTS_FEEDBACK_MODAL_TEST_ID}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') as string }}
        >
          <Text variant={TextVariant.HeadingSm}>
            {t('marketInsightsFeedbackTitle')}
          </Text>
        </ModalHeader>
        <ModalBody className="max-h-[560px] overflow-y-auto px-4">
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {t('marketInsightsFeedbackDescription')}
          </Text>

          <Box
            flexDirection={BoxFlexDirection.Column}
            className="mt-4 gap-4"
            role="radiogroup"
            aria-label={t('marketInsightsFeedbackTitle') as string}
          >
            {FEEDBACK_OPTIONS.map((option) => {
              const isSelected = option.reason === selectedReason;

              return (
                <label key={option.reason} className="cursor-pointer">
                  <input
                    type="radio"
                    name={reasonGroupName}
                    className="peer sr-only"
                    checked={isSelected}
                    onChange={() => handleReasonPress(option.reason)}
                    data-testid={option.testId}
                  />
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    className="gap-3 rounded-sm py-1 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-default"
                  >
                    <Box
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected ? 'border-primary-default' : 'border-muted'
                      }`}
                    >
                      {isSelected ? (
                        <Box className="h-3 w-3 rounded-full bg-primary-default" />
                      ) : null}
                    </Box>
                    <Text variant={TextVariant.BodyMd}>
                      {t(option.labelKey)}
                    </Text>
                  </Box>
                </label>
              );
            })}
          </Box>

          {isSomethingElse ? (
            <Box className="mt-5">
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextDefault}
                className="mb-2"
              >
                <label htmlFor={feedbackInputId}>
                  {t('marketInsightsFeedbackAdditionalLabel')}
                </label>
              </Text>
              <TextArea
                id={feedbackInputId}
                value={additionalFeedback}
                onChange={(event) => setAdditionalFeedback(event.target.value)}
                maxLength={MAX_FEEDBACK_LENGTH}
                placeholder={
                  t('marketInsightsFeedbackAdditionalPlaceholder') as string
                }
                className="min-h-[96px]"
                data-testid="market-insights-feedback-additional-input"
              />
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-2"
              >
                {t('marketInsightsFeedbackCharactersRemaining', [
                  String(remainingChars),
                ])}
              </Text>
            </Box>
          ) : null}

          <Box marginTop={6} marginBottom={4}>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full"
              isDisabled={!canSubmit}
              onClick={handleSubmit}
              data-testid="market-insights-feedback-submit-button"
            >
              {t('marketInsightsFeedbackSubmit')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
