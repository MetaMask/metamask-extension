import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { Textarea, TextareaResize } from '../../component-library/textarea';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
  TextField,
  TextFieldType,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { parseSecretRecoveryPhrase } from './parse-secret-recovery-phrase';

const SRP_LENGTHS = [12, 15, 18, 21, 24];
const MAX_SRP_LENGTH = 24;

type DraftSrp = {
  word: string;
  id: string;
  active: boolean;
};

type ListOfTextFieldRefs = {
  [wordId: string]: HTMLInputElement;
};

type SrpInputImportProps = {
  onChange: (srp: string) => void;
};

export default function SrpInputImport({ onChange }: SrpInputImportProps) {
  const t = useI18nContext();
  const [draftSrp, setDraftSrp] = useState<DraftSrp[]>([]);
  const [firstWord, setFirstWord] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [missSpelledWords, setMissSpelledWords] = useState<string[]>([]);

  const srpRefs = useRef<ListOfTextFieldRefs>({});

  const initializeSrp = () => {
    setDraftSrp([
      { word: firstWord, id: uuidv4(), active: false },
      { word: '', id: uuidv4(), active: true },
    ]);
    setFirstWord('');
  };

  const onSrpPaste = (rawSrp: string) => {
    const parsedSrp = parseSecretRecoveryPhrase(rawSrp);
    const splittedSrp = parsedSrp.split(' ');
    const newDraftSrp = splittedSrp.map((word: string) => ({
      word,
      id: uuidv4(),
      active: false,
    }));

    newDraftSrp[newDraftSrp.length - 1].active = true;

    setDraftSrp(newDraftSrp);
  };

  const setWordActive = (srp: DraftSrp[], wordId: string) => {
    const newDraftSrp = [...srp];
    newDraftSrp.forEach((word) => {
      word.active = word.id === wordId;
    });
    return newDraftSrp;
  };

  const handleChange = (id: string, value: string) => {
    const newDraftSrp = [...draftSrp];
    const targetIndex = newDraftSrp.findIndex((word) => word.id === id);
    newDraftSrp[targetIndex] = { ...newDraftSrp[targetIndex], word: value };
    setDraftSrp(setWordActive(newDraftSrp, id));
  };

  const nextWord = (currentWordId: string) => {
    const currentWordIndex = draftSrp.findIndex(
      (word) => word.id === currentWordId,
    );
    const isLastWord = currentWordIndex === draftSrp.length - 1;

    // if last word, add new word
    if (isLastWord && draftSrp.length < MAX_SRP_LENGTH) {
      const newDraftSrp = [...draftSrp];

      newDraftSrp.forEach((word) => {
        word.active = false;
      });

      newDraftSrp.push({
        word: '',
        id: uuidv4(),
        active: true,
      });
      setDraftSrp(newDraftSrp);
      return;
    }

    // set next word to active
    setDraftSrp(setWordActive(draftSrp, draftSrp[currentWordIndex + 1].id));
  };

  const deleteWord = (wordId: string) => {
    const currentWordIndex = draftSrp.findIndex((word) => word.id === wordId);
    const previousWordId = draftSrp[currentWordIndex - 1]?.id;
    const newDraftSrp = [...draftSrp];
    newDraftSrp.splice(currentWordIndex, 1);

    if (newDraftSrp.length > 0) {
      setDraftSrp(setWordActive(newDraftSrp, previousWordId));
    } else {
      setDraftSrp([]);
    }
  };

  const handleOnKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      initializeSrp();
    }
  };

  const handleOnPaste = (
    clipBoardEvent: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    clipBoardEvent.preventDefault();
    const newSrp = clipBoardEvent.clipboardData.getData('text');
    if (newSrp.trim().match(/\s/u)) {
      clipBoardEvent.preventDefault();
      onSrpPaste(newSrp);
    }
  };

  const setWordInactive = (wordId: string) => {
    const newDraftSrp = [...draftSrp];
    const targetIndex = newDraftSrp.findIndex((word) => word.id === wordId);
    newDraftSrp[targetIndex] = { ...newDraftSrp[targetIndex], active: false };
    setDraftSrp(newDraftSrp);
  };

  const onWordFocus = (wordId: string) => {
    srpRefs.current[wordId].type = 'text';
    const newDraftSrp = [...draftSrp];
    newDraftSrp.forEach((word) => {
      word.active = word.id === wordId;
    });
    setDraftSrp(newDraftSrp);
  };

  useEffect(() => {
    const activeWord = draftSrp.find((word) => word.active);
    if (activeWord) {
      srpRefs.current[activeWord.id]?.focus();
    }

    const wordsNotInWordList = draftSrp
      .map((word) => word.word)
      .filter((word) => word !== '' && !wordlist.includes(word));
    setMissSpelledWords(wordsNotInWordList);

    // if srp length is valid and no empty word trigger onChange
    if (
      SRP_LENGTHS.includes(draftSrp.length) &&
      !draftSrp.some((word) => word.word.length === 0) &&
      wordsNotInWordList.length === 0
    ) {
      const stringSrp = draftSrp.map((word) => word.word).join(' ');
      onChange(stringSrp);
    } else {
      onChange('');
    }
  }, [draftSrp, onChange]);

  return (
    <>
      <div className="srp-input-import__container">
        {draftSrp.length > 0 ? (
          <div className="srp-input-import__srp-container">
            <div className="srp-input-import__words-list">
              {draftSrp.map((word, index) => (
                <TextField
                  inputProps={{
                    ref: (el) => {
                      if (el) {
                        srpRefs.current[word.id] = el;
                      }
                    },
                  }}
                  testId={`import-srp__srp-word-${index}`}
                  key={word.id}
                  error={missSpelledWords.includes(word.word)}
                  value={word.word}
                  type={
                    word.active ||
                    showAll ||
                    missSpelledWords.includes(word.word)
                      ? TextFieldType.Text
                      : TextFieldType.Password
                  }
                  startAccessory={
                    <Text
                      color={TextColor.textAlternative}
                      className="srp-input-import__word-index"
                    >
                      {index + 1}
                    </Text>
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(word.id, e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      nextWord(word.id);
                    }
                    if (e.key === 'Backspace' && word.word.length === 0) {
                      e.preventDefault();
                      deleteWord(word.id);
                    }
                  }}
                  onFocus={() => {
                    onWordFocus(word.id);
                  }}
                  onBlur={() => {
                    setWordInactive(word.id);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="srp-input-import__srp-note">
            <Textarea
              data-testid="srp-input-import__srp-note"
              borderColor={BorderColor.transparent}
              backgroundColor={BackgroundColor.transparent}
              width={BlockSize.Full}
              placeholder={`${t('onboardingSrpInputPlaceholder')} 👀`}
              rows={7}
              resize={TextareaResize.None}
              value={firstWord}
              onChange={(e) => setFirstWord(e.target.value)}
              onKeyDown={handleOnKeyDown}
              onPaste={handleOnPaste}
            />
          </div>
        )}

        <div className="srp-input-import__actions">
          <Button
            variant={ButtonVariant.Link}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? t('onboardingSrpInputHideAll')
              : t('onboardingSrpInputShowAll')}
          </Button>
          {draftSrp.length > 0 ? (
            <Button
              variant={ButtonVariant.Link}
              onClick={async () => {
                setShowAll(false);
                setDraftSrp([]);
              }}
            >
              {t('onboardingSrpInputClearAll')}
            </Button>
          ) : (
            <Button
              variant={ButtonVariant.Link}
              onClick={async () => {
                // TODO: this requires user permission
                const newSrp = await window.navigator.clipboard.readText();
                if (newSrp.trim().match(/\s/u)) {
                  onSrpPaste(newSrp);
                }
              }}
            >
              {t('paste')}
            </Button>
          )}
        </div>
      </div>
      {missSpelledWords.length > 0 && (
        <Box marginTop={2}>
          <Text color={TextColor.errorDefault} variant={TextVariant.bodySm}>
            {t('onboardingSrpImportError')}
          </Text>
        </Box>
      )}
    </>
  );
}

SrpInputImport.propTypes = {
  /**
   * Event handler for SRP changes.
   *
   * This is only called with a valid, well-formated (i.e. exactly one space
   * between each word) SRP or with an empty string.
   *
   * This is called each time the draft SRP is updated. If the draft SRP is
   * valid, this is called with a well-formatted version of that draft SRP.
   * Otherwise, this is called with an empty string.
   */
  onChange: PropTypes.func.isRequired,
};
