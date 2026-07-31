import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconName, ModalOverlay } from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Answers,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  QuestionId,
  QuestionOption,
  TOTAL_QUESTIONS,
  getRedFlagCount,
} from './scam-questionnaire.constants';
import { SecurityCheckHeader } from './security-check-header';
import { QuestionScreen } from './question-screen';
import { ScamWarning } from './scam-warning';
import { useScamQuestionnaireMetrics } from './useScamQuestionnaireMetrics';

export type ScamQuestionnaireProps = {
  /** User answered with no red flags. */
  onCleanPass: () => void;
  /** User chose "Stop this payment" on the warning. */
  onReject: () => void;
  /** User chose to continue past the warning. */
  onBypass: () => void;
  /** User dismissed without finishing (back / close). */
  onDismiss: () => void;
};

// Steps 0-2 are the questions; the final index is the warning screen.
type Step = 0 | 1 | 2 | 3;
const WARNING_STEP = TOTAL_QUESTIONS;

const QUESTION_DEFS: Record<
  0 | 1 | 2,
  {
    id: QuestionId;
    icon: IconName;
    titleKey: string;
    subtitleKey: string;
    options: QuestionOption[];
  }
> = {
  0: {
    id: 'q1',
    icon: IconName.Messages,
    titleKey: 'scamQuestionnaireQ1Title',
    subtitleKey: 'scamQuestionnaireQ1Subtitle',
    options: Q1_OPTIONS,
  },
  1: {
    id: 'q2',
    icon: IconName.Coin,
    titleKey: 'scamQuestionnaireQ2Title',
    subtitleKey: 'scamQuestionnaireQ2Subtitle',
    options: Q2_OPTIONS,
  },
  2: {
    id: 'q3',
    icon: IconName.Call,
    titleKey: 'scamQuestionnaireQ3Title',
    subtitleKey: 'scamQuestionnaireQ3Subtitle',
    options: Q3_OPTIONS,
  },
};

export const ScamQuestionnaire: React.FC<ScamQuestionnaireProps> = ({
  onCleanPass,
  onReject,
  onBypass,
  onDismiss,
}) => {
  const t = useI18nContext();
  const metrics = useScamQuestionnaireMetrics();

  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Answers>({});
  // Per-step in-progress selection so the Continue button stays disabled until tapped.
  const [pendingSelection, setPendingSelection] = useState<
    QuestionOption | undefined
  >();
  // Contact Support isn't terminal — the warning stays up afterwards — so it
  // rides along as a property on whichever terminal event follows.
  const [contactSupportClicked, setContactSupportClicked] = useState(false);

  // Fire Scam Questionnaire Viewed at most once per question per session.
  // Backward navigation to a previously viewed question is a no-op — the
  // impression is already recorded. Aligns with Mixpanel funnel drop-off
  // analysis (unique users per step, not raw view count).
  const viewedStepsRef = useRef<Set<0 | 1 | 2>>(new Set());
  useEffect(() => {
    if (step < TOTAL_QUESTIONS) {
      const questionStep = step as 0 | 1 | 2;
      if (!viewedStepsRef.current.has(questionStep)) {
        viewedStepsRef.current.add(questionStep);
        metrics.trackViewed(questionStep);
      }
    }
  }, [step, metrics]);

  // Fire Scam Questionnaire Warning Displayed once per session when the
  // warning screen first renders.
  const warningDisplayedRef = useRef(false);
  useEffect(() => {
    if (step === WARNING_STEP && !warningDisplayedRef.current) {
      warningDisplayedRef.current = true;
      metrics.trackWarningDisplayed(answers);
    }
  }, [step, answers, metrics]);

  const handleBack = useCallback(() => {
    if (step === WARNING_STEP) {
      setStep((WARNING_STEP - 1) as Step);
      return;
    }
    if (step === 0) {
      metrics.trackDismissed({
        furthestStep: 0,
        contactSupportClicked,
        answers,
      });
      onDismiss();
      return;
    }
    const prevStep = (step - 1) as 0 | 1;
    setPendingSelection(answers[QUESTION_DEFS[prevStep].id]);
    setStep(prevStep);
  }, [step, answers, contactSupportClicked, metrics, onDismiss]);

  const handleSelect = useCallback((option: QuestionOption) => {
    setPendingSelection(option);
  }, []);

  const handleContinue = useCallback(() => {
    if (step === WARNING_STEP || !pendingSelection) {
      return;
    }
    const def = QUESTION_DEFS[step];
    const nextAnswers: Answers = {
      ...answers,
      [def.id]: pendingSelection,
    };
    setAnswers(nextAnswers);

    if (step < TOTAL_QUESTIONS - 1) {
      const nextStep = (step + 1) as 0 | 1 | 2;
      setPendingSelection(answers[QUESTION_DEFS[nextStep].id]);
      setStep(nextStep);
      return;
    }

    // Final question answered — branch to the warning or pass cleanly.
    if (getRedFlagCount(nextAnswers) > 0) {
      setStep(WARNING_STEP);
    } else {
      metrics.trackCompleted({
        status: 'clean',
        contactSupportClicked,
        answers: nextAnswers,
      });
      onCleanPass();
    }
  }, [
    step,
    pendingSelection,
    answers,
    contactSupportClicked,
    metrics,
    onCleanPass,
  ]);

  const handleStop = useCallback(() => {
    metrics.trackCompleted({
      status: 'payment_stopped',
      contactSupportClicked,
      answers,
    });
    onReject();
  }, [answers, contactSupportClicked, metrics, onReject]);

  const handleContactSupport = useCallback(() => {
    setContactSupportClicked(true);
  }, []);

  const handleProceed = useCallback(() => {
    metrics.trackCompleted({
      status: 'proceeded',
      contactSupportClicked,
      answers,
    });
    onBypass();
  }, [answers, contactSupportClicked, metrics, onBypass]);

  const handleRequestClose = useCallback(() => {
    metrics.trackDismissed({
      furthestStep: step,
      contactSupportClicked,
      answers,
    });
    onDismiss();
  }, [step, answers, contactSupportClicked, metrics, onDismiss]);

  // `ModalContent` binds its Escape-key listener once on mount, so the
  // `onClose` it captures never updates. Route the modal through a ref-backed
  // wrapper so an Escape press reports the step and answers as of the press
  // rather than as of the first render.
  const requestCloseRef = useRef(handleRequestClose);
  useEffect(() => {
    requestCloseRef.current = handleRequestClose;
  }, [handleRequestClose]);
  const handleModalClose = useCallback(() => {
    requestCloseRef.current();
  }, []);

  const questionDef = step === WARNING_STEP ? null : QUESTION_DEFS[step];

  return (
    <Modal
      isOpen
      onClose={handleModalClose}
      isClosedOnOutsideClick={false}
      data-testid="scam-questionnaire-modal"
    >
      <ModalOverlay />
      {/* Full-bleed takeover: fill the whole confirmation popup rather than
          floating as a centered card, so nothing peeks through behind it. */}
      <ModalContent
        size={ModalContentSize.Sm}
        className="!p-0"
        modalDialogProps={{
          className: 'h-full max-h-full !rounded-none !py-0',
          style: { maxWidth: 'none' },
        }}
      >
        <SecurityCheckHeader
          currentStep={step === WARNING_STEP ? null : step}
          totalSteps={TOTAL_QUESTIONS}
          onBack={handleBack}
        />
        <Box className="flex min-h-0 flex-1 flex-col">
          {questionDef ? (
            <QuestionScreen
              iconName={questionDef.icon}
              title={t(questionDef.titleKey)}
              subtitle={t(questionDef.subtitleKey)}
              options={questionDef.options}
              selectedKey={pendingSelection?.key}
              onSelect={handleSelect}
              onContinue={handleContinue}
            />
          ) : (
            <ScamWarning
              onStop={handleStop}
              onContactSupport={handleContactSupport}
              onProceed={handleProceed}
            />
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default ScamQuestionnaire;
