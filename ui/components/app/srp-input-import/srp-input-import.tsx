import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { isValidMnemonic } from '@ethersproject/hdnode';

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
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
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
  onClearCallback?: () => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function SrpInputImport({
  onChange,
  onClearCallback,
}: SrpInputImportProps) {
  const t = useI18nContext();
  const [draftSrp, setDraftSrp] = useState<DraftSrp[]>([]);
  const [firstWord, setFirstWord] = useState('');
  const [misSpelledWords, setMisSpelledWords] = useState<DraftSrp[]>([]);

  const srpRefs = useRef<ListOfTextFieldRefs>({});
  const onChangeRef = useRef(onChange);

  // Keep the ref updated with the latest onChange callback
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const checkForInvalidWords = useCallback(
    (srp?: DraftSrp[]) => {
      const draftSrpToCheck = srp ?? draftSrp;
      draftSrpToCheck.forEach((word) => {
        const isInWordlist = wordlist.includes(word.word);
        const alreadyInMisspelled = misSpelledWords.some(
          (w) => w.id === word.id,
        );
        if (isInWordlist && alreadyInMisspelled) {
          setMisSpelledWords((prev) => prev.filter((w) => w.id !== word.id));
        } else if (!isInWordlist && !alreadyInMisspelled && word.word !== '') {
          setMisSpelledWords((prev) => [...prev, word]);
        }
      });
    },
    [draftSrp, misSpelledWords],
  );

  const initializeSrp = () => {
    const firstWordId = uuidv4();
    setDraftSrp([
      { word: firstWord, id: firstWordId, active: false },
      { word: '', id: uuidv4(), active: true },
    ]);
    setFirstWord('');
    if (!wordlist.includes(firstWord)) {
      setMisSpelledWords((prev) => [
        ...prev,
        { word: firstWord, id: firstWordId, active: false },
      ]);
    }
  };

  const onSrpPaste = (rawSrp: string) => {
    const parsedSrp = parseSecretRecoveryPhrase(rawSrp);
    const splittedSrp = parsedSrp.split(' ');
    const finalSplittedSrp =
      splittedSrp.length > MAX_SRP_LENGTH
        ? splittedSrp.slice(0, MAX_SRP_LENGTH)
        : splittedSrp;

    const newDraftSrp: DraftSrp[] = finalSplittedSrp.map((word: string) => ({
      word,
      id: uuidv4(),
      active: false,
    }));

    if (!SRP_LENGTHS.includes(finalSplittedSrp.length)) {
      newDraftSrp.push({
        word: '',
        id: uuidv4(),
        active: true,
      });
    }

    checkForInvalidWords(newDraftSrp);
    setDraftSrp(newDraftSrp);
  };

  const setWordActive = (srp: DraftSrp[], wordId: string) => {
    const newDraftSrp = [...srp];
    newDraftSrp.forEach((word) => {
      word.active = word.id === wordId;
    });
    return newDraftSrp;
  };

  const handleChange = useCallback(
    (id: string, value: string) => {
      if (value === ' ') {
        return;
      }

      const newDraftSrp = [...draftSrp];
      const targetIndex = newDraftSrp.findIndex((word) => word.id === id);
      newDraftSrp[targetIndex] = { ...newDraftSrp[targetIndex], word: value };
      setDraftSrp(setWordActive(newDraftSrp, id));
      onClearCallback?.();
    },
    [draftSrp, onClearCallback],
  );

  const nextWord = useCallback(
    (currentWordId: string) => {
      const currentWordIndex = draftSrp.findIndex(
        (word) => word.id === currentWordId,
      );
      const isLastWord = currentWordIndex === draftSrp.length - 1;

      if (isLastWord) {
        checkForInvalidWords();
      }

      if (
        (SRP_LENGTHS.includes(draftSrp.length) &&
          isValidMnemonic(draftSrp.map((word) => word.word).join(' '))) ||
        draftSrp.length === MAX_SRP_LENGTH
      ) {
        return;
      }

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
    },
    [checkForInvalidWords, draftSrp],
  );

  const deleteWord = useCallback(
    (wordId: string) => {
      const currentWordIndex = draftSrp.findIndex((word) => word.id === wordId);

      const updatedMisSpelledWords = misSpelledWords.filter(
        (word) => word.id !== wordId,
      );
      setMisSpelledWords(updatedMisSpelledWords);

      const previousWordId = draftSrp[currentWordIndex - 1]?.id;
      const newDraftSrp = [...draftSrp];
      newDraftSrp.splice(currentWordIndex, 1);

      if (newDraftSrp.length > 0) {
        setDraftSrp(setWordActive(newDraftSrp, previousWordId));
      } else {
        setDraftSrp([]);
      }
    },
    [draftSrp, misSpelledWords],
  );

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

  const setWordInactive = useCallback(
    (wordId: string) => {
      const newDraftSrp = [...draftSrp];
      const targetIndex = newDraftSrp.findIndex((word) => word.id === wordId);
      newDraftSrp[targetIndex] = { ...newDraftSrp[targetIndex], active: false };
      setDraftSrp(newDraftSrp);
    },
    [draftSrp],
  );

  const onWordFocus = useCallback(
    (wordId: string) => {
      srpRefs.current[wordId].type = 'text';
      const newDraftSrp = [...draftSrp];
      newDraftSrp.forEach((word) => {
        word.active = word.id === wordId;
      });
      setDraftSrp(newDraftSrp);
    },
    [draftSrp],
  );

  // in firefox, we do need to request permission explicitly, to read the clipboard
  const requestPermissionAndTriggerPasteFireFox = async () => {
    try {
      const permissionGranted = await browser.permissions.request({
        permissions: ['clipboardRead'],
      });
      if (permissionGranted) {
        const newSrp = await navigator.clipboard.readText();
        if (newSrp.trim().match(/\s/u)) {
          onSrpPaste(newSrp);
        }
      }
    } catch (error) {
      console.error('Error requesting clipboard permission', error);
    }
  };

  const onTriggerPaste = async () => {
    setMisSpelledWords([]);
    if (getBrowserName() === PLATFORM_FIREFOX) {
      await requestPermissionAndTriggerPasteFireFox();
      return;
    }

    const permissionResult = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    });

    if (
      permissionResult.state === 'granted' ||
      permissionResult.state === 'prompt'
    ) {
      const newSrp = await navigator.clipboard.readText();
      if (newSrp.trim().match(/\s/u)) {
        onSrpPaste(newSrp);
      }
    }
  };

  useEffect(() => {
    const activeWord = draftSrp.find((word) => word.active);
    if (activeWord) {
      srpRefs.current[activeWord.id]?.focus();
    }

    // if srp length is valid and no empty word trigger onChange
    if (
      SRP_LENGTHS.includes(draftSrp.length) &&
      !draftSrp.some((word) => word.word.length === 0)
    ) {
      const hasInvalidWords = draftSrp.some(
        (word) => word.word !== '' && !wordlist.includes(word.word),
      );

      if (hasInvalidWords) {
        onChangeRef.current('');
      } else {
        const stringSrp = draftSrp.map((word) => word.word).join(' ');
        onChangeRef.current(stringSrp);
      }
    } else {
      onChangeRef.current('');
    }
  }, [draftSrp]);

  const misSpelledWordsList = useCallback(
    () => misSpelledWords.map((word) => word.word),
    [misSpelledWords],
  );

  return (
    <>
      <Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          backgroundColor={BackgroundColor.backgroundSection}
          borderRadius={BorderRadius.LG}
          className="srp-input-import__container"
        >
          {draftSrp.length > 0 ? (
            <Box padding={4} style={{ flex: 1 }}>
              <Box
                display={Display.Grid}
                className="srp-input-import__words-list"
                gap={2}
              >
                {draftSrp.map((word, index) => {
                  return (
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
                      error={
                        !word.active &&
                        misSpelledWordsList().includes(word.word)
                      }
                      value={word.word}
                      type={
                        word.active || misSpelledWordsList().includes(word.word)
                          ? TextFieldType.Text
                          : TextFieldType.Password
                      }
                      startAccessory={
                        <Text
                          color={TextColor.textAlternative}
                          textAlign={TextAlign.Left}
                          className="srp-input-import__word-index"
                        >
                          {index + 1}.
                        </Text>
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange(word.id, e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (word.word.trim() !== '') {
                            nextWord(word.id);
                          }
                        } else if (
                          e.key === 'Backspace' &&
                          word.word.length === 0
                        ) {
                          e.preventDefault();
                          deleteWord(word.id);
                        }
                      }}
                      onFocus={() => {
                        onWordFocus(word.id);
                      }}
                      onBlur={() => {
                        setWordInactive(word.id);
                        checkForInvalidWords();
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box
              padding={4}
              className="srp-input-import__srp-note"
              style={{ flex: 1 }}
              borderRadius={BorderRadius.LG}
            >
              <Textarea
                data-testid="srp-input-import__srp-note"
                borderColor={BorderColor.transparent}
                backgroundColor={BackgroundColor.transparent}
                width={BlockSize.Full}
                placeholder={t('onboardingSrpInputPlaceholder')}
                rows={7}
                resize={TextareaResize.None}
                value={firstWord}
                paddingTop={0}
                paddingBottom={0}
                paddingLeft={0}
                paddingRight={0}
                onChange={(e) => setFirstWord(e.target.value)}
                onKeyDown={handleOnKeyDown}
                onPaste={handleOnPaste}
                autoFocus
              />
            </Box>
          )}
        </Box>
        <Box
          display={Display.Flex}
          className="srp-input-import__actions"
          justifyContent={JustifyContent.flexEnd}
          paddingRight={2}
        >
          {draftSrp.length > 0 ? (
            <Button
              variant={ButtonVariant.Link}
              onClick={async () => {
                setDraftSrp([]);
                setMisSpelledWords([]);
                onClearCallback?.();
              }}
            >
              {t('onboardingSrpInputClearAll')}
            </Button>
          ) : (
            <Button
              data-testid="srp-input-import__paste-button"
              variant={ButtonVariant.Link}
              onClick={onTriggerPaste}
            >
              {t('paste')}
            </Button>
          )}
        </Box>
      </Box>
      {misSpelledWords.length > 0 && (
        <Box marginTop={2}>
          <Text color={TextColor.errorDefault} variant={TextVariant.bodySm}>
            {t('onboardingSrpImportError')}
          </Text>
        </Box>
      )}
    </>
  );
}
