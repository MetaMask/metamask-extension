import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonBase,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextField,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  Display,
  TextColor,
  FontWeight,
  FlexDirection,
  BlockSize,
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';

export default function RecoveryPhraseChips({
  secretRecoveryPhrase,
  phraseRevealed = true,
  revealPhrase,
  confirmPhase,
  quizWords = [],
  setInputValue,
}) {
  const t = useI18nContext();
  const phrasesToDisplay = secretRecoveryPhrase;
  const indicesToCheck = quizWords.map((word) => word.index);
  const [quizAnswers, setQuizAnswers] = useState(
    indicesToCheck.map((index) => ({
      index,
      word: '',
    })),
  );

  const setNextTargetIndex = (newQuizAnswers) => {
    const emptyAnswers = newQuizAnswers
      .filter((answer) => answer.word === '')
      .map((answer) => answer.index);
    const firstEmpty = emptyAnswers.length ? Math.min(...emptyAnswers) : -1;

    return firstEmpty;
  };
  const [indexToFocus, setIndexToFocus] = useState(
    setNextTargetIndex(quizAnswers),
  );

  const addQuizWord = (word) => {
    const newQuizAnswers = [...quizAnswers];
    const targetIndex = newQuizAnswers.findIndex(
      (answer) => answer.index === indexToFocus,
    );
    newQuizAnswers[targetIndex] = { index: indexToFocus, word };
    setQuizAnswers(newQuizAnswers);
    setIndexToFocus(setNextTargetIndex(newQuizAnswers));
  };

  const removeQuizWord = (answerWord) => {
    const newQuizAnswers = [...quizAnswers];
    const targetIndex = newQuizAnswers.findIndex(
      (answer) => answer.word === answerWord,
    );
    newQuizAnswers[targetIndex] = {
      ...newQuizAnswers[targetIndex],
      word: '',
    };

    setQuizAnswers(newQuizAnswers);
    setIndexToFocus(setNextTargetIndex(newQuizAnswers));
  };

  useEffect(() => {
    setInputValue && setInputValue(quizAnswers);
  }, [quizAnswers, setInputValue]);

  useEffect(() => {
    if (quizWords.length) {
      const newIndicesToCheck = quizWords.map((word) => word.index);
      const newQuizAnswers = newIndicesToCheck.map((index) => ({
        index,
        word: '',
      }));
      setQuizAnswers(newQuizAnswers);
      setIndexToFocus(setNextTargetIndex(newQuizAnswers));
    }
  }, [quizWords]);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      <Box
        padding={4}
        borderRadius={BorderRadius.LG}
        display={Display.Grid}
        className="recovery-phrase__secret"
      >
        <div
          data-testid="recovery-phrase-chips"
          data-recovery-phrase={secretRecoveryPhrase.join(':')}
          data-quiz-words={JSON.stringify(quizWords)}
          className={classnames('recovery-phrase__chips', {
            'recovery-phrase__chips--hidden': !phraseRevealed,
          })}
        >
          {phrasesToDisplay.map((word, index) => {
            const isQuizWord = indicesToCheck.includes(index);
            const wordToDisplay = isQuizWord
              ? quizAnswers.find((answer) => answer.index === index)?.word || ''
              : word;
            return (
              <TextField
                testId={
                  confirmPhase && isQuizWord
                    ? `recovery-phrase-input-${index}`
                    : `recovery-phrase-chip-${index}`
                }
                key={index}
                value={wordToDisplay}
                className={classnames({
                  'mm-text-field--target-index': index === indexToFocus,
                  'mm-text-field--quiz-word': isQuizWord,
                })}
                startAccessory={
                  <Text
                    color={TextColor.textAlternative}
                    className="recovery-phrase__word-index"
                  >
                    {index + 1}.
                  </Text>
                }
                readOnly
                disabled={confirmPhase && !isQuizWord}
                onClick={() => {
                  if (!confirmPhase) {
                    return;
                  }
                  if (wordToDisplay === '') {
                    setIndexToFocus(index);
                  } else {
                    removeQuizWord(wordToDisplay);
                  }
                }}
              />
            );
          })}
        </div>

        {!phraseRevealed && (
          <div className="recovery-phrase__secret-blocker-container">
            <div className="recovery-phrase__secret-blocker" />
            <Box
              className="recovery-phrase__secret-blocker-text"
              onClick={() => {
                revealPhrase && revealPhrase();
              }}
              data-testid="recovery-phrase-reveal"
            >
              <Icon
                name={IconName.EyeSlash}
                color={IconColor.iconDefault}
                size={IconSize.Md}
              />
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
                fontWeight={FontWeight.Medium}
              >
                {t('tapToReveal')}
              </Text>
              <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
                {t('tapToRevealNote')}
              </Text>
            </Box>
          </div>
        )}
      </Box>
      {quizWords.length > 0 && (
        <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
          {quizWords.map((value) => {
            const answeredWords = quizAnswers.map((answer) => answer.word);
            const isAnswered = answeredWords.includes(value.word);
            return isAnswered ? (
              <ButtonBase
                data-testid={`recovery-phrase-quiz-answered-${value.index}`}
                key={value.index}
                color={TextColor.textAlternative}
                borderRadius={BorderRadius.LG}
                block
                onClick={() => {
                  removeQuizWord(value.word);
                }}
              >
                {value.word}
              </ButtonBase>
            ) : (
              <Button
                data-testid={`recovery-phrase-quiz-unanswered-${value.index}`}
                key={value.index}
                variant={ButtonVariant.Secondary}
                borderRadius={BorderRadius.LG}
                block
                onClick={() => {
                  addQuizWord(value.word);
                }}
              >
                {value.word}
              </Button>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

RecoveryPhraseChips.propTypes = {
  secretRecoveryPhrase: PropTypes.array,
  phraseRevealed: PropTypes.bool,
  revealPhrase: PropTypes.func,
  confirmPhase: PropTypes.bool,
  quizWords: PropTypes.array,
  setInputValue: PropTypes.func,
};
