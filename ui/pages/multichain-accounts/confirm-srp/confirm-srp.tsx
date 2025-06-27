import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library/button-icon';
import {
  BackgroundColor,
  BlockSize,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../components/component-library';
import RecoveryPhraseChips from '../../onboarding-flow/recovery-phrase/recovery-phrase-chips';
import ConfirmSrpModal from '../../onboarding-flow/recovery-phrase/confirm-srp-modal';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';

type ConfirmSrpProps = {
  secretRecoveryPhrase: string;
  onBackupComplete: () => void;
};

type QuizWord = {
  index: number;
  word: string;
};

const QUIZ_WORDS_COUNT = 3;

const generateQuizWords = (secretRecoveryPhrase: string[]): QuizWord[] => {
  const randomIndices = new Set<number>();
  const srpLength = secretRecoveryPhrase.length;

  if (srpLength === 0) {
    return [];
  }

  while (randomIndices.size < QUIZ_WORDS_COUNT) {
    const randomIndex = Math.floor(Math.random() * srpLength);
    randomIndices.add(randomIndex);
  }

  const quizWords = Array.from(randomIndices).map((index: number) => {
    return {
      index,
      word: secretRecoveryPhrase[index],
    };
  });

  return quizWords;
};

export const ConfirmSrp = ({
  secretRecoveryPhrase,
  onBackupComplete,
}: ConfirmSrpProps) => {
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const splitSecretRecoveryPhrase = useMemo(
    () => (secretRecoveryPhrase ? secretRecoveryPhrase.split(' ') : []),
    [secretRecoveryPhrase],
  );
  const [quizWords, setQuizWords] = useState<QuizWord[]>(
    generateQuizWords(splitSecretRecoveryPhrase),
  );
  const [matching, setMatching] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [answerSrp, setAnswerSrp] = useState('');

  const resetQuizWords = useCallback(() => {
    const newQuizWords = generateQuizWords(splitSecretRecoveryPhrase);
    setQuizWords(newQuizWords);
  }, [splitSecretRecoveryPhrase]);

  const handleQuizInput = useCallback(
    (inputValue: QuizWord[]) => {
      const isNotAnswered = inputValue.some((answer) => !answer.word);
      if (isNotAnswered) {
        setAnswerSrp('');
      } else {
        const copySplitSrp = [...splitSecretRecoveryPhrase];
        inputValue.forEach((answer: QuizWord) => {
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
    // TODO: create a new event for this

    onBackupComplete();
    history.push(ACCOUNT_DETAILS_ROUTE);
  }, [dispatch, history, onBackupComplete]);

  return (
    <Page>
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.goBack()}
          />
        }
      >
        {t('confirmRecoveryPhrase')}
      </Header>
      <Content>
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
        <Box marginBottom={6}>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('confirmRecoveryPhraseDetails')}
          </Text>
        </Box>
        {splitSecretRecoveryPhrase.length > 0 && (
          <RecoveryPhraseChips
            secretRecoveryPhrase={splitSecretRecoveryPhrase}
            quizWords={quizWords as any}
            confirmPhase
            setInputValue={handleQuizInput}
          />
        )}
      </Content>
      <Footer>
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
      </Footer>
    </Page>
  );
};
