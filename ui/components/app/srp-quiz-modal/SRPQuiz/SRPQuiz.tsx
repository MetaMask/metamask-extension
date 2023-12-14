/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-commonjs */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { REVEAL_SEED_ROUTE } from '../../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalOverlay,
} from '../../../component-library';
import { ModalContent } from '../../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../../component-library/modal-header/deprecated';
import QuizContent from '../QuizContent';
import { JSXDict, QuizStage } from '../types';

const wrongAnswerIcon = (
  <Icon
    size={IconSize.Xl}
    name={IconName.Warning}
    color={IconColor.errorDefault}
    textAlign={TextAlign.Center}
    width={BlockSize.OneTwelfth}
  />
);

const rightAnswerIcon = (
  <Icon
    size={IconSize.Xl}
    name={IconName.Confirmation}
    color={IconColor.successDefault}
    textAlign={TextAlign.Center}
    width={BlockSize.OneTwelfth}
  />
);

const openSupportArticle = (): void => {
  global.platform.openTab({
    url: ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE,
  });
};

export default function SRPQuiz(props: any) {
  const [stage, setStage] = useState<QuizStage>(QuizStage.introduction);

  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const t = useI18nContext();

  // This should not be a state variable, because it's derivable from the state variable `stage`
  // (Making it a state variable forces the component to render twice)
  let title = '';

  // Using a dictionary of JSX elements eliminates the need for a switch statement
  const stages: JSXDict = {};

  stages[QuizStage.introduction] = () => {
    title = t('srpSecurityQuizTitle');
    return (
      <QuizContent
        image={'images/reveal-srp.png'}
        content={t('srpSecurityQuizIntroduction')}
        buttons={[
          {
            label: t('srpSecurityQuizGetStarted'),
            onClick: () => setStage(QuizStage.questionOne),
            variant: ButtonVariant.Primary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-get-started',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
            'data-testid': 'srp-quiz-learn-more',
          },
        ]}
      />
    );
  };

  stages[QuizStage.questionOne] = () => {
    title = `1 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        content={t('srpSecurityQuizQuestionOneQuestion')}
        buttons={[
          {
            label: t('srpSecurityQuizQuestionOneWrongAnswer'),
            onClick: () => setStage(QuizStage.wrongAnswerQuestionOne),
            variant: ButtonVariant.Secondary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-wrong-answer',
          },
          {
            label: t('srpSecurityQuizQuestionOneRightAnswer'),
            onClick: () => setStage(QuizStage.rightAnswerQuestionOne),
            variant: ButtonVariant.Secondary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-right-answer',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  stages[QuizStage.rightAnswerQuestionOne] = () => {
    title = `1 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        icon={rightAnswerIcon}
        content={t('srpSecurityQuizQuestionOneRightAnswerTitle')}
        moreContent={t('srpSecurityQuizQuestionOneRightAnswerDescription')}
        buttons={[
          {
            label: t('continue'),
            onClick: () => setStage(QuizStage.questionTwo),
            variant: ButtonVariant.Primary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-continue',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  stages[QuizStage.wrongAnswerQuestionOne] = () => {
    title = `1 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        icon={wrongAnswerIcon}
        content={t('srpSecurityQuizQuestionOneWrongAnswerTitle')}
        moreContent={t('srpSecurityQuizQuestionOneWrongAnswerDescription')}
        buttons={[
          {
            label: t('tryAgain'),
            onClick: () => setStage(QuizStage.questionOne),
            variant: ButtonVariant.Primary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-try-again',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  stages[QuizStage.questionTwo] = () => {
    title = `2 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        content={t('srpSecurityQuizQuestionTwoQuestion')}
        buttons={[
          {
            label: t('srpSecurityQuizQuestionTwoRightAnswer'),
            onClick: () => setStage(QuizStage.rightAnswerQuestionTwo),
            variant: ButtonVariant.Secondary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-right-answer',
          },
          {
            label: t('srpSecurityQuizQuestionTwoWrongAnswer'),
            onClick: () => setStage(QuizStage.wrongAnswerQuestionTwo),
            variant: ButtonVariant.Secondary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-wrong-answer',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  stages[QuizStage.rightAnswerQuestionTwo] = () => {
    title = `2 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        icon={rightAnswerIcon}
        content={t('srpSecurityQuizQuestionTwoRightAnswerTitle')}
        moreContent={t('srpSecurityQuizQuestionTwoRightAnswerDescription')}
        buttons={[
          {
            label: t('continue'),
            onClick: () => history.push(REVEAL_SEED_ROUTE),
            variant: ButtonVariant.Primary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-continue',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  stages[QuizStage.wrongAnswerQuestionTwo] = () => {
    title = `2 ${t('ofTextNofM')} 2`;
    return (
      <QuizContent
        icon={wrongAnswerIcon}
        content={t('srpSecurityQuizQuestionTwoWrongAnswerTitle')}
        moreContent={t('srpSecurityQuizQuestionTwoWrongAnswerDescription')}
        buttons={[
          {
            label: t('tryAgain'),
            onClick: () => setStage(QuizStage.questionTwo),
            variant: ButtonVariant.Primary,
            size: ButtonSize.Lg,
            'data-testid': 'srp-quiz-try-again',
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: ButtonVariant.Link,
          },
        ]}
      />
    );
  };

  // trackEvent shortcut specific to the SRP quiz
  const trackEventSrp = useCallback((location) => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportSelected,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          location,
        },
      },
      {},
    );
  }, []);

  useEffect(() => {
    trackEventSrp(`stage_${stage}`); // Call MetaMetrics based on the current stage
  }, [stage]); // Only call this when the stage changes

  const quizContent = stages[stage](); // Pick the content using the right stage from the JSXDict

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
        }}
      >
        <ModalHeader onClose={props.onClose} data-testid="srp-quiz-header">
          {title}
        </ModalHeader>
        <span data-testid={`srp_stage_${stage}`} />
        {quizContent}
      </ModalContent>
    </Modal>
  );
}
