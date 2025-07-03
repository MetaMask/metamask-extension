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

  const quizOptions = useMemo(() => {
    if (!quizWords.length) return [];
    return quizWords.map((quizWord) => {
      const correctWord = secretRecoveryPhrase[quizWord.index];
      const otherWords = secretRecoveryPhrase.filter((w, idx) => idx !== quizWord.index);
      const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
      const distractors = shuffled.slice(0, 2);
      const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5);
      return {
        index: quizWord.index,
        options,
        correct: correctWord,
      };
    });
  }, [quizWords, secretRecoveryPhrase]);

  const [userSelections, setUserSelections] = useState(Array(quizWords.length).fill(''));

  const quizAnswers = useMemo(() =>
    quizWords.map((quizWord, idx) => ({
      index: quizWord.index,
      word: userSelections[idx] || '',
    })),
    [quizWords, userSelections],
  );

  useEffect(() => {
    setInputValue?.(quizAnswers);
  }, [quizAnswers, setInputValue]);

  useEffect(() => {
    setUserSelections(Array(quizWords.length).fill(''));
  }, [quizWords]);

  if (confirmPhase && quizWords.length === 3) {
    return (
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        {quizOptions.map((group, groupIdx) => {
          const isGroupAnswered = userSelections[groupIdx] === group.correct;
          return (
            <Box key={group.index}>
              <Text
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
                marginBottom={2}
              >
                {`Word #${group.index + 1}`}
              </Text>
              <Box display={Display.Flex} gap={2}>
                {group.options.map((option) => {
                  const selected = userSelections[groupIdx] === option;
                  const canClick = (!isGroupAnswered && !selected) || (isGroupAnswered && selected);
                  return (
                    <ButtonBase
                      key={option}
                      className={classnames('recovery-phrase-quiz-option', {
                        'recovery-phrase-quiz-option--selected': selected,
                      })}
                      style={{
                        border: selected
                          ? '2px solid #0376c9'
                          : '1px solid #d6d9dc',
                        background: selected ? '#eaf6ff' : '#fff',
                        minWidth: 120,
                        minHeight: 40,
                        fontWeight: selected ? 600 : 400,
                        opacity: !canClick ? 0.5 : 1,
                        cursor: !canClick ? 'not-allowed' : 'pointer',
                      }}
                      disabled={!canClick}
                      onClick={() => {
                        if (!canClick) return;
                        const newSelections = [...userSelections];
                        if (isGroupAnswered && selected) {
                          newSelections[groupIdx] = '';
                        } else {
                          newSelections[groupIdx] = option;
                        }
                        setUserSelections(newSelections);
                      }}
                    >
                      {option}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  const phrasesToDisplay = secretRecoveryPhrase;
  const indicesToCheck = useMemo(
    () => quizWords.map((word) => word.index),
    [quizWords],
  );
  const [legacyQuizAnswers, setLegacyQuizAnswers] = useState(
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
    setNextTargetIndex(legacyQuizAnswers),
  );

  const addQuizWord = useCallback(
    (word, actualIndexInSrp) => {
      const newQuizAnswers = [...legacyQuizAnswers];
      const targetIndex = newQuizAnswers.findIndex(
        (answer) => answer.index === indexToFocus,
      );
      newQuizAnswers[targetIndex] = {
        index: indexToFocus,
        word,
        actualIndexInSrp,
      };
      setLegacyQuizAnswers(newQuizAnswers);
      setIndexToFocus(setNextTargetIndex(newQuizAnswers));
    },
    [legacyQuizAnswers, indexToFocus],
  );

  const removeQuizWord = useCallback(
    (answerWord) => {
      const newQuizAnswers = [...legacyQuizAnswers];
      const targetIndex = newQuizAnswers.findIndex(
        (answer) => answer.word === answerWord,
      );
      newQuizAnswers[targetIndex] = {
        ...newQuizAnswers[targetIndex],
        word: '',
        actualIndexInSrp: -1,
      };

      setLegacyQuizAnswers(newQuizAnswers);
      setIndexToFocus(setNextTargetIndex(newQuizAnswers));
    },
    [legacyQuizAnswers],
  );

  useEffect(() => {
    setInputValue?.(legacyQuizAnswers);
  }, [legacyQuizAnswers, setInputValue]);

  useEffect(() => {
    if (quizWords.length) {
      const newQuizAnswers = quizWords.map((word) => ({
        index: word.index,
        word: '',
        actualIndexInSrp: -1,
      }));
      setLegacyQuizAnswers(newQuizAnswers);
      setIndexToFocus(setNextTargetIndex(newQuizAnswers));
    }
  }, [quizWords]);

  const [hoveredIndex, setHoveredIndex] = useState(null);

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
              ? legacyQuizAnswers.find((answer) => answer.index === index)?.word || ''
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
                  'mm-text-field--blurred': hoveredIndex !== index,
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
                readOnly
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
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
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
            const isAnswered = legacyQuizAnswers.some(
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
