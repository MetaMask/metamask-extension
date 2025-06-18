import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  JustifyContent,
  AlignItems,
  BackgroundColor,
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
  const indicesToCheck = useMemo(
    () => quizWords.map((word) => word.index),
    [quizWords],
  );
  const [quizAnswers, setQuizAnswers] = useState(
    indicesToCheck.map((index) => ({
      index,
      word: '',
    })),
  );

  const setNextTargetIndex = (newQuizAnswers) => {
    const emptyAnswers = newQuizAnswers.reduce((acc, answer) => {
      if (answer.word === '') {
        acc.push(answer.index);
      }
      return acc;
    }, []);
    const firstEmpty = emptyAnswers.length ? Math.min(...emptyAnswers) : -1;

    return firstEmpty;
  };
  const [indexToFocus, setIndexToFocus] = useState(
    setNextTargetIndex(quizAnswers),
  );

  const addQuizWord = useCallback(
    (word) => {
      const newQuizAnswers = [...quizAnswers];
      const targetIndex = newQuizAnswers.findIndex(
        (answer) => answer.index === indexToFocus,
      );
      newQuizAnswers[targetIndex] = { index: indexToFocus, word };
      setQuizAnswers(newQuizAnswers);
      setIndexToFocus(setNextTargetIndex(newQuizAnswers));
    },
    [quizAnswers, indexToFocus],
  );

  const removeQuizWord = useCallback(
    (answerWord) => {
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
    },
    [quizAnswers],
  );

  useEffect(() => {
    setInputValue?.(quizAnswers);
  }, [quizAnswers, setInputValue]);

  useEffect(() => {
    if (quizWords.length) {
      const newQuizAnswers = quizWords.map((word) => ({
        index: word.index,
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
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundMuted}
        className="recovery-phrase__secret"
      >
        <Box
          display={Display.Grid}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          gap={2}
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
        </Box>

        {!phraseRevealed && (
          <Box
            width={BlockSize.Full}
            height={BlockSize.Full}
            className="recovery-phrase__secret-blocker-container"
          >
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              borderRadius={BorderRadius.SM}
              backgroundColor={BackgroundColor.backgroundMuted}
              width={BlockSize.Full}
              height={BlockSize.Full}
              paddingTop={2}
              paddingBottom={9}
              paddingInline={0}
              className="recovery-phrase__secret-blocker"
            />
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              height={BlockSize.Full}
              width={BlockSize.Full}
              gap={2}
              className="recovery-phrase__secret-blocker-text"
              onClick={() => {
                revealPhrase?.();
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
          </Box>
        )}
      </Box>
      {quizWords.length > 0 && (
        <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
          {quizWords.map((value) => {
            const isAnswered = quizAnswers.some((x) => x.word === value.word);
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
