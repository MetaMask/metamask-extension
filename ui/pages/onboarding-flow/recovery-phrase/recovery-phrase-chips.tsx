import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'clsx';
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
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconColor,
  BoxBackgroundColor,
  BoxBorderColor,
} from '@metamask/design-system-react';
import {
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  TextVariant as DesignSystemTextVariant,
} from '../../../helpers/constants/design-system';

type RecoveryPhraseChipsProps = {
  secretRecoveryPhrase: string[];
  phraseRevealed?: boolean;
  revealPhrase?: () => void;
  confirmPhase?: boolean;
  quizWords?: { index: number; word: string }[];
  setInputValue?: (inputValue: { index: number; word: string }[]) => void;
  recoveryPhraseChipsContainerClassName?: string;
};
// this was Truffle's original dev recovery phrase from ~2017
export const fakeSeedPhraseWords = [
  'candy',
  'maple',
  'cake',
  'sugar',
  'pudding',
  'cream',
  'honey',
  'rich',
  'smooth',
  'crumble',
  'sweet',
  'treat',
];

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RecoveryPhraseChips({
  secretRecoveryPhrase,
  phraseRevealed = true,
  revealPhrase,
  confirmPhase,
  quizWords = [],
  setInputValue,
  recoveryPhraseChipsContainerClassName = '',
}: RecoveryPhraseChipsProps) {
  const t = useI18nContext();
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

  const setNextTargetIndex = (
    newQuizAnswers: { index: number; word: string }[],
  ) => {
    const emptyAnswers = newQuizAnswers.reduce(
      (acc: number[], answer: { index: number; word: string }) => {
        if (answer.word === '') {
          acc.push(answer.index);
        }
        return acc;
      },
      [],
    );
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

  // obfuscate the blurred recovery phrase to prevent blur-reversal attacks
  // from revealing the underlying words.
  const phrasesToDisplay = phraseRevealed
    ? secretRecoveryPhrase
    : secretRecoveryPhrase.map((_word, index) => {
        return fakeSeedPhraseWords[index % fakeSeedPhraseWords.length];
      });

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundSection}
        className={classnames(
          'recovery-phrase__secret rounded-lg w-full',
          recoveryPhraseChipsContainerClassName,
        )}
      >
        <Box
          key="recovery-phrase-chips"
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          data-testid="recovery-phrase-chips"
          data-recovery-phrase={secretRecoveryPhrase.join(':')}
          data-quiz-words={JSON.stringify(quizWords)}
          className={classnames('recovery-phrase__chips grid', {
            'recovery-phrase__chips--hidden': !phraseRevealed,
          })}
        >
          {phrasesToDisplay.map((word, index) => {
            const isQuizWord = indicesToCheck.includes(index);
            const wordToDisplay = isQuizWord
              ? quizAnswers.find((answer) => answer.index === index)?.word || ''
              : word;
            const isTargetIndex = index === indexToFocus;
            return isQuizWord || !confirmPhase ? (
              <Box
                key={index}
                data-testid={`recovery-phrase-chip-${index}`}
                className="recovery-phrase__text rounded-lg px-2"
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                backgroundColor={
                  isQuizWord
                    ? BoxBackgroundColor.BackgroundDefault
                    : BoxBackgroundColor.BackgroundMuted
                }
                borderColor={
                  isTargetIndex
                    ? BoxBorderColor.PrimaryDefault
                    : BoxBorderColor.BorderMuted
                }
                borderWidth={isTargetIndex ? 2 : 1}
                paddingTop={1}
                paddingBottom={1}
                gap={1}
                onClick={() => {
                  if (!isQuizWord) {
                    return;
                  }
                  if (wordToDisplay === '') {
                    setIndexToFocus(index);
                  } else {
                    removeQuizWord(wordToDisplay);
                  }
                }}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                  className="recovery-phrase__word-index"
                >
                  {index + 1}.
                </Text>
                <Text variant={TextVariant.BodyMd}>
                  {isQuizWord ? wordToDisplay : word}
                </Text>
              </Box>
            ) : (
              <TextField
                testId={`recovery-phrase-chip-${index}`}
                key={index}
                value={wordToDisplay}
                inputProps={{
                  textVariant: DesignSystemTextVariant.bodyMd,
                }}
                startAccessory={
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextAlternative}
                    className="recovery-phrase__word-index"
                  >
                    {index + 1}.
                  </Text>
                }
                type={TextFieldType.Password}
                disabled
                readOnly
                backgroundColor={BackgroundColor.backgroundMuted}
              />
            );
          })}
        </Box>

        {!phraseRevealed && (
          <Box
            key="recovery-phrase__secret-blocker-container"
            className="recovery-phrase__secret-blocker-container w-full h-full"
          >
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              paddingTop={2}
              paddingBottom={9}
              className="recovery-phrase__secret-blocker rounded-sm w-full h-full px-0"
            />
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              backgroundColor={BoxBackgroundColor.Transparent}
              gap={2}
              className="recovery-phrase__secret-blocker-text w-full h-full"
              onClick={() => {
                revealPhrase?.();
              }}
              data-testid="recovery-phrase-reveal"
            >
              <Icon
                name={IconName.EyeSlash}
                color={IconColor.IconDefault}
                size={IconSize.Md}
              />
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextDefault}
                fontWeight={FontWeight.Medium}
              >
                {t('tapToReveal')}
              </Text>
              <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
                {t('tapToRevealNote')}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      {quizWords.length === 3 && (
        <Box flexDirection={BoxFlexDirection.Row} gap={2} className="w-full">
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
                color={TextColor.TextAlternative}
                className="rounded-lg w-full bg-muted"
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
                className="rounded-lg w-full bg-muted border-primary-default border text-primary-default"
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
