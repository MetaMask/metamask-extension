import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  TextVariant,
  JustifyContent,
  BlockSize,
  TextColor,
  IconColor,
  Display,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import {
  DEFAULT_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import RecoveryPhraseChips from './recovery-phrase-chips';

const QUIZ_WORDS_COUNT = 3;

const generateQuizWords = (secretRecoveryPhrase) => {
  const randomIndices = new Set();
  const srpLength = secretRecoveryPhrase.length;

  if (srpLength === 0) {
    return [];
  }

  while (randomIndices.size < QUIZ_WORDS_COUNT) {
    const randomIndex = Math.floor(Math.random() * srpLength);
    randomIndices.add(randomIndex);
  }

  const quizWords = Array.from(randomIndices).map((index) => {
    return {
      index,
      word: secretRecoveryPhrase[index],
    };
  });

  return quizWords;
};

export default function ConfirmRecoveryPhrase({ secretRecoveryPhrase = '' }) {
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { search } = useLocation();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const splitSecretRecoveryPhrase = useMemo(
    () => (secretRecoveryPhrase ? secretRecoveryPhrase.split(' ') : []),
    [secretRecoveryPhrase],
  );
  const searchParams = new URLSearchParams(search);
  const isFromReminderParam = searchParams.get('isFromReminder')
    ? '/?isFromReminder=true'
    : '';

  const [quizWords, setQuizWords] = useState(
    generateQuizWords(splitSecretRecoveryPhrase),
  );
  const [answerSrp, setAnswerSrp] = useState('');

  useEffect(() => {
    if (!secretRecoveryPhrase) {
      history.push(`${ONBOARDING_REVIEW_SRP_ROUTE}${isFromReminderParam}`);
    }
  }, [history, secretRecoveryPhrase, isFromReminderParam]);

  const handleQuizInput = useCallback(
    (inputValue) => {
      const isNotAnswered = inputValue.some((answer) => !answer.word);
      if (isNotAnswered) {
        setAnswerSrp('');
      } else {
        const copySplitSrp = [...splitSecretRecoveryPhrase];
        inputValue.forEach((answer) => {
          copySplitSrp[answer.index] = answer.word;
        });
        setAnswerSrp(copySplitSrp.join(' '));
      }
    },
    [splitSecretRecoveryPhrase],
  );

  const handleConfirmedPhrase = useCallback(() => {
    dispatch(setSeedPhraseBackedUp(true));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });

    history.push(DEFAULT_ROUTE);
  }, [dispatch, hdEntropyIndex, history, trackEvent]);

  const onContinue = useCallback(() => {
    handleConfirmedPhrase();
  }, [handleConfirmedPhrase]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      gap={6}
      className="recovery-phrase recovery-phrase__confirm"
      data-testid="confirm-recovery-phrase"
    >
      <Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="confirm-recovery-phrase-back-button"
            onClick={() => history.goBack()}
            ariaLabel={t('back')}
          />
        </Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          {!isFromReminderParam && (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('stepOf', [3, 3])}
            </Text>
          )}
          <Text variant={TextVariant.headingLg} as="h2">
            {t('confirmRecoveryPhraseTitle')}
          </Text>
        </Box>
        {splitSecretRecoveryPhrase.length > 0 && (
          <>
            <RecoveryPhraseChips
              secretRecoveryPhrase={splitSecretRecoveryPhrase}
              quizWords={quizWords}
              confirmPhase
              setInputValue={handleQuizInput}
            />
            <Box marginTop={4}>
              {[
                'seedPhraseReviewDetails',
                'seedPhraseReviewDetails1',
                'seedPhraseReviewDetails2',
                'seedPhraseReviewDetails3',
                'seedPhraseReviewDetails4',
              ].map((key) => (
                <Box
                  key={key}
                  display={Display.Flex}
                  alignItems={AlignItems.flexStart}
                >
                  <Text
                    style={{
                      color: '#D92D20',
                      marginRight: 8,
                      fontSize: 18,
                      lineHeight: '22px',
                    }}
                  >
                    •
                  </Text>
                  <Text
                    variant={TextVariant.bodyMd}
                    style={{ color: '#D92D20' }}
                  >
                    {t(key)}
                  </Text>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
      <Box width={BlockSize.Full}>
        <Button
          variant={ButtonVariant.Primary}
          width={BlockSize.Full}
          data-testid="recovery-phrase-confirm"
          size={ButtonSize.Lg}
          className="recovery-phrase__footer__confirm--button"
          onClick={() => onContinue()}
          disabled={answerSrp.trim() === ''}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}

ConfirmRecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};
