/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-commonjs */
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  BlockSize,
  IconColor,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { REVEAL_SEED_ROUTE } from '../../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BUTTON_VARIANT,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
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

  // Using a function dictionary eliminates the need for a switch statement
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
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.SECONDARY,
          },
          {
            label: t('srpSecurityQuizQuestionOneRightAnswer'),
            onClick: () => setStage(QuizStage.rightAnswerQuestionOne),
            variant: BUTTON_VARIANT.SECONDARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.SECONDARY,
          },
          {
            label: t('srpSecurityQuizQuestionTwoWrongAnswer'),
            onClick: () => setStage(QuizStage.wrongAnswerQuestionTwo),
            variant: BUTTON_VARIANT.SECONDARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
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

  const quizContent = useMemo(() => {
    trackEventSrp(`stage_${stage}`); // Call MetaMetrics based on the current stage

    return stages[stage](); // Pick the right stage from the FunctionDict
  }, [stage]);

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={props.onClose} margin={4}>
          {title}
        </ModalHeader>
        {quizContent}
      </ModalContent>
    </Modal>
  );
}
