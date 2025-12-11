import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  TextAlign,
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
  PREVIOUS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { TraceName } from '../../../../shared/lib/trace';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import ConfirmSrpModal from './confirm-srp-modal';
import RecoveryPhraseChips from './recovery-phrase-chips';

const QUIZ_WORDS_COUNT = 3;

const generateQuizWords = (
  secretRecoveryPhrase: string[],
): { index: number; word: string }[] => {
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
      index: index as number,
      word: secretRecoveryPhrase[index as number],
    };
  });

  return quizWords;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConfirmRecoveryPhrase({ secretRecoveryPhrase = '' }) {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { search } = useLocation();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedEndTrace } = trackEvent;
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const hasSeedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  const splitSecretRecoveryPhrase = useMemo(
    () => (secretRecoveryPhrase ? secretRecoveryPhrase.split(' ') : []),
    [secretRecoveryPhrase],
  );
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');

  const queryParams = new URLSearchParams();
  if (isFromReminder) {
    queryParams.set('isFromReminder', isFromReminder);
  }
  if (isFromSettingsSecurity) {
    queryParams.set('isFromSettingsSecurity', isFromSettingsSecurity);
  }
  const nextRouteQueryString = queryParams.toString();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [matching, setMatching] = useState(false);
  const [quizWords, setQuizWords] = useState(
    generateQuizWords(splitSecretRecoveryPhrase),
  );
  const [answerSrp, setAnswerSrp] = useState('');

  useEffect(() => {
    if (!secretRecoveryPhrase) {
      navigate(
        `${ONBOARDING_REVEAL_SRP_ROUTE}${
          nextRouteQueryString ? `?${nextRouteQueryString}` : ''
        }`,
        { replace: true },
      );
    } else if (hasSeedPhraseBackedUp) {
      const isFirefox = getBrowserName() === PLATFORM_FIREFOX;
      // if user has already done the Secure Wallet flow, we can redirect to the next page
      navigate(
        isFirefox || isFromReminder
          ? ONBOARDING_COMPLETION_ROUTE
          : ONBOARDING_METAMETRICS,
        { replace: true },
      );
    }
  }, [
    navigate,
    secretRecoveryPhrase,
    nextRouteQueryString,
    hasSeedPhraseBackedUp,
    isFromReminder,
  ]);

  const resetQuizWords = useCallback(() => {
    const newQuizWords = generateQuizWords(splitSecretRecoveryPhrase);
    setQuizWords(newQuizWords);
  }, [splitSecretRecoveryPhrase]);

  const handleQuizInput = useCallback(
    (inputValue) => {
      const isNotAnswered = inputValue.some(
        (answer: { word: string }) => !answer.word,
      );
      if (isNotAnswered) {
        setAnswerSrp('');
      } else {
        const copySplitSrp = [...splitSecretRecoveryPhrase];
        inputValue.forEach((answer: { index: number; word: string }) => {
          copySplitSrp[answer.index] = answer.word;
        });
        setAnswerSrp(copySplitSrp.join(' '));
      }
    },
    [splitSecretRecoveryPhrase],
  );

  const onContinue = useCallback(() => {
    const isMatching = answerSrp === secretRecoveryPhrase;
    setMatching(isMatching);
    setShowConfirmModal(true);
  }, [answerSrp, secretRecoveryPhrase]);

  const handleConfirmedPhrase = useCallback(() => {
    dispatch(setSeedPhraseBackedUp(true));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    bufferedEndTrace?.({ name: TraceName.OnboardingNewSrpCreateWallet });
    bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });

    const nextRoute =
      getBrowserName() === PLATFORM_FIREFOX || isFromReminder
        ? ONBOARDING_COMPLETION_ROUTE
        : ONBOARDING_METAMETRICS;

    navigate(
      `${nextRoute}${nextRouteQueryString ? `?${nextRouteQueryString}` : ''}`,
      { replace: true },
    );
  }, [
    dispatch,
    hdEntropyIndex,
    navigate,
    trackEvent,
    isFromReminder,
    nextRouteQueryString,
    bufferedEndTrace,
  ]);

  const onClose = useCallback(() => {
    navigate(REVEAL_SRP_LIST_ROUTE, { replace: true });
  }, [navigate]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={6}
      className="recovery-phrase recovery-phrase__confirm"
      data-testid="confirm-recovery-phrase"
    >
      <Box>
        {showConfirmModal && (
          <ConfirmSrpModal
            isError={!matching}
            onContinue={handleConfirmedPhrase}
            onClose={() => {
              resetQuizWords();
              setShowConfirmModal(false);
            }}
          />
        )}
        {isFromReminder && isFromSettingsSecurity ? (
          <Box
            className="recovery-phrase__header"
            display={Display.Grid}
            alignItems={AlignItems.center}
            gap={1}
            marginBottom={4}
            width={BlockSize.Full}
          >
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.iconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-confirm-back-button"
              onClick={() => navigate(PREVIOUS_ROUTE)}
              ariaLabel={t('back')}
            />
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('confirmRecoveryPhraseTitleSettings')}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              color={IconColor.iconDefault}
              size={ButtonIconSize.Md}
              data-testid="reveal-recovery-phrase-confirm-close-button"
              onClick={onClose}
              ariaLabel={t('close')}
            />
          </Box>
        ) : (
          <>
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
                onClick={() => navigate(PREVIOUS_ROUTE)}
                ariaLabel={t('back')}
              />
            </Box>
            <Box
              justifyContent={JustifyContent.flexStart}
              marginBottom={4}
              width={BlockSize.Full}
            >
              <Text variant={TextVariant.headingLg} as="h2">
                {t('confirmRecoveryPhraseTitle')}
              </Text>
            </Box>
          </>
        )}
        <Box marginBottom={6}>
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            {t('confirmRecoveryPhraseDetails')}
          </Text>
        </Box>
        {splitSecretRecoveryPhrase.length > 0 && (
          <RecoveryPhraseChips
            secretRecoveryPhrase={splitSecretRecoveryPhrase}
            quizWords={quizWords}
            confirmPhase
            setInputValue={handleQuizInput}
          />
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
