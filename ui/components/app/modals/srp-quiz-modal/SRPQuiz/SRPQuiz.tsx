/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-commonjs */
import React, { useCallback, useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  BLOCK_SIZES,
  IconColor,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { REVEAL_SEED_ROUTE } from '../../../../../helpers/constants/routes';
import withModalProps from '../../../../../helpers/higher-order-components/with-modal-props/with-modal-props';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { setUserCompletedSRPQuiz } from '../../../../../store/actions';

import {
  BUTTON_VARIANT,
  Icon,
  IconName,
  IconSize,
} from '../../../../component-library';
import Box from '../../../../ui/box';
import QuizContent from '../QuizContent';
import { QuizStage } from '../types';

const SRPQuiz = (props: any) => {
  const dispatch = useDispatch();

  const [stage, setStage] = useState<QuizStage>(QuizStage.introduction);

  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();

  const t = useI18nContext();

  const openSupportArticle = (): void => {
    global.platform.openTab({
      url: 'https://support.metamask.io/hc/en-us/articles/4404722782107',
    });
  };

  const goToRevealPrivateCredential = () => {
    if (props.isSecurityCheckList) {
      setUserCompletedSRPQuiz(true);
    } else {
      history.push(REVEAL_SEED_ROUTE);
    }
    props.hideModal();
  };

  const dismissModal = () => {
    props.hideModal();
    props.handleQuizFailed();
  };

  const wrongAnswerIcon = useCallback(
    () => (
      <Icon
        size={IconSize.Xl}
        name={IconName.Warning}
        color={IconColor.errorDefault}
        textAlign={TextAlign.Center}
        width={BLOCK_SIZES.ONE_TWELFTH}
      />
    ),
    [],
  );

  const rightAnswerIcon = useCallback(
    () => (
      <Icon
        size={IconSize.Xl}
        name={IconName.Confirmation}
        color={IconColor.successDefault}
        textAlign={TextAlign.Center}
        width={BLOCK_SIZES.ONE_TWELFTH}
      />
    ),
    [],
  );

  const introduction = useCallback(() => {
    return (
      <QuizContent
        header={t('srpSecurityQuizTitle')}
        image={'images/reveal-srp.png'}
        title={{
          content: t('srpSecurityQuizIntroduction'),
        }}
        buttons={[
          {
            label: t('srpSecurityQuizGetStarted'),
            onClick: () => {
              setStage(QuizStage.questionOne);
            },
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
          },
        ]}
        dismiss={dismissModal}
      />
    );
  }, []);

  const questionOne = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SRP_REVEAL_FIRST_QUESTION_SEEN,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      },
      {},
    );
    return (
      <QuizContent
        header={`1 ${t('ofTextNofM')} 2`}
        title={{
          content: t('srpSecurityQuizQuestionOneQuestion'),
        }}
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
        dismiss={dismissModal}
      />
    );
  }, []);

  const rightAnswerQuestionOne = useCallback(() => {
    return (
      <QuizContent
        header={`1 ${t('ofTextNofM')} 2`}
        icon={rightAnswerIcon}
        title={{
          content: t('srpSecurityQuizQuestionOneRightAnswerTitle'),
        }}
        content={t('srpSecurityQuizQuestionOneRightAnswerDescription')}
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
        dismiss={dismissModal}
      />
    );
  }, [rightAnswerIcon]);

  const wrongAnswerQuestionOne = useCallback(() => {
    return (
      <QuizContent
        header={`1 ${t('ofTextNofM')} 2`}
        icon={wrongAnswerIcon}
        title={{
          content: t('srpSecurityQuizQuestionOneWrongAnswerTitle'),
        }}
        content={t('srpSecurityQuizQuestionOneWrongAnswerDescription')}
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
        dismiss={dismissModal}
      />
    );
  }, [wrongAnswerIcon]);

  const questionTwo = useCallback(() => {
    return (
      <QuizContent
        header={`2 ${t('ofTextNofM')} 2`}
        title={{
          content: t('srpSecurityQuizQuestionTwoQuestion'),
        }}
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
        dismiss={dismissModal}
      />
    );
  }, []);

  const rightAnswerQuestionTwo = useCallback(() => {
    return (
      <QuizContent
        header={`2 ${t('ofTextNofM')} 2`}
        icon={rightAnswerIcon}
        title={{
          content: t('srpSecurityQuizQuestionTwoRightAnswerTitle'),
        }}
        content={t('srpSecurityQuizQuestionTwoRightAnswerDescription')}
        buttons={[
          {
            label: t('continue'),
            onClick: goToRevealPrivateCredential,
            variant: BUTTON_VARIANT.PRIMARY,
          },
          {
            label: t('learnMoreUpperCase'),
            onClick: openSupportArticle,
            variant: BUTTON_VARIANT.LINK,
          },
        ]}
        dismiss={dismissModal}
      />
    );
  }, [goToRevealPrivateCredential, rightAnswerIcon]);

  const wrongAnswerQuestionTwo = useCallback(() => {
    return (
      <QuizContent
        header={`2 ${t('ofTextNofM')} 2`}
        icon={wrongAnswerIcon}
        title={{
          content: t('srpSecurityQuizQuestionTwoWrongAnswerTitle'),
        }}
        content={t('srpSecurityQuizQuestionTwoWrongAnswerDescription')}
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
        dismiss={dismissModal}
      />
    );
  }, [wrongAnswerIcon]);

  const quizPage = useCallback(() => {
    switch (stage) {
      case QuizStage.introduction:
        return introduction();
      case QuizStage.questionOne:
        return questionOne();
      case QuizStage.rightAnswerQuestionOne:
        return rightAnswerQuestionOne();
      case QuizStage.wrongAnswerQuestionOne:
        return wrongAnswerQuestionOne();
      case QuizStage.questionTwo:
        return questionTwo();
      case QuizStage.rightAnswerQuestionTwo:
        return rightAnswerQuestionTwo();
      case QuizStage.wrongAnswerQuestionTwo:
        return wrongAnswerQuestionTwo();
    }
  }, [
    stage,
    introduction,
    questionOne,
    rightAnswerQuestionOne,
    wrongAnswerQuestionOne,
    questionTwo,
    rightAnswerQuestionTwo,
    wrongAnswerQuestionTwo,
  ]);

  return <Box margin={3}>{quizPage()}</Box>;
};

export default withModalProps(SRPQuiz);
