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
  BorderColor,
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
      index, // the index in the SRP chips UI where the answer is inserted
      word: '', // the answer value
      actualIndexInSrp: -1, // the correct index of the answer value in the secret recovery phrase
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
    (word, actualIndexInSrp) => {
      const newQuizAnswers = [...quizAnswers];
      const targetIndex = newQuizAnswers.findIndex(
        (answer) => answer.index === indexToFocus,
      );
      newQuizAnswers[targetIndex] = {
        index: indexToFocus,
        word,
        actualIndexInSrp,
      };
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
        actualIndexInSrp: -1,
      };

      setQuizAnswers(newQuizAnswers);
      setIndexToFocus(newQuizAnswers[targetIndex].index);
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
        actualIndexInSrp: -1,
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
        backgroundColor={BackgroundColor.backgroundSection}
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
            return confirmPhase ? (
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
                type={confirmPhase && !isQuizWord ? 'password' : 'text'}
                disabled={
                  (confirmPhase && !isQuizWord) ||
                  (!confirmPhase && !phraseRevealed)
                }
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
            ) : (
              <Box
                data-testid={`recovery-phrase-chip-${index}`}
                className="recovery-phrase__text"
                display={Display.Flex}
                alignItems={AlignItems.center}
                backgroundColor={BackgroundColor.backgroundDefault}
                borderColor={BorderColor.borderMuted}
                borderRadius={BorderRadius.XL}
                paddingInline={2}
                paddingTop={1}
                paddingBottom={1}
                gap={1}
              >
                <Text
                  color={TextColor.textAlternative}
                  className="recovery-phrase__word-index"
                >
                  {index + 1}.
                </Text>
                <Text>{word}</Text>
              </Box>
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
              width={BlockSize.Full}
              height={BlockSize.Full}
              paddingTop={2}
              paddingBottom={9}
              paddingInline={0}
              className="recovery-phrase__secret-blocker"
            />
            <Box
              as="button"
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              backgroundColor={BackgroundColor.transparent}
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
      {quizWords.length === 3 && (
        <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
          {quizWords.map((quizWord) => {
            const actualIdxInSrp = quizWord.index;
            // check if the quiz word has been added to the quizAnswers array
            // here we are checking the answer's actual index in the secret recovery phrase
            // to handle the case where the quiz words has the same value but different indexes
            // e.g. the quiz words are ["one", "two", "one"]
            const isAnswered = quizAnswers.some(
              (answer) => answer.actualIndexInSrp === actualIdxInSrp,
            );
            return isAnswered ? (
              <ButtonBase
                data-testid={`recovery-phrase-quiz-answered-${actualIdxInSrp}`}
                key={quizWord.index}
                color={TextColor.textAlternative}
                borderRadius={BorderRadius.LG}
                block
                onClick={() => {
                  removeQuizWord(quizWord.word);
                }}
              >
                {secretRecoveryPhrase[actualIdxInSrp]}
              </ButtonBase>
            ) : (
              <Button
                data-testid={`recovery-phrase-quiz-unanswered-${actualIdxInSrp}`}
                key={quizWord.index}
                variant={ButtonVariant.Secondary}
                borderRadius={BorderRadius.LG}
                block
                onClick={() => {
                  addQuizWord(quizWord.word, actualIdxInSrp);
                }}
              >
                {secretRecoveryPhrase[actualIdxInSrp]}
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
