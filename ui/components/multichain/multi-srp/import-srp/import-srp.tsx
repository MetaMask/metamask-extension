import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { isValidMnemonic } from '@ethersproject/hdnode';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import * as actions from '../../../../store/actions';
import {
  Text,
  Box,
  ButtonPrimary,
  BannerAlert,
  BannerAlertSeverity,
  Label,
  TextField,
  ButtonLink,
  TextFieldType,
} from '../../../component-library';
import {
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import { setShowNewSrpAddedToast } from '../../../app/toast-master/utils';
import { parseSecretRecoveryPhrase } from '../../../app/srp-input/parse-secret-recovery-phrase';
import { clearClipboard } from '../../../../helpers/utils/util';

const hasUpperCase = (draftSrp: string) => {
  return draftSrp !== draftSrp.toLowerCase();
};

const defaultNumberOfWords = 12;

export const ImportSrp = ({
  onActionComplete,
}: {
  onActionComplete: (completed: boolean) => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [srpError, setSrpError] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState(
    Array(defaultNumberOfWords).fill(''),
  );
  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);
  const [invalidSrpWords, setInvalidSrpWords] = useState(
    Array(defaultNumberOfWords).fill(false),
  );

  const [loading, setLoading] = useState(false);

  async function importWallet() {
    const joinedSrp = secretRecoveryPhrase.join(' ');
    if (joinedSrp) {
      await dispatch(actions.importMnemonicToVault(joinedSrp));
      // Clear the secret recovery phrase after importing
      setSecretRecoveryPhrase(Array(defaultNumberOfWords).fill(''));
    }
  }

  const isValidSrp = useMemo(() => {
    return isValidMnemonic(secretRecoveryPhrase.join(' '));
  }, [secretRecoveryPhrase]);

  const onSrpChange = useCallback(
    (newDraftSrp: string[]) => {
      const validateSrp = (phrase: string[], words: boolean[]) => {
        if (!phrase.some((word) => word !== '')) {
          return { error: '', words };
        }

        const state = {
          error: '',
          words: phrase.map((word) => !wordlist.includes(word)),
        };

        return state;
      };

      const validateCompleteness = (
        state: { error: string; words: boolean[] },
        phrase: string[],
      ) => {
        if (state.error) {
          return state;
        }
        if (phrase.some((word) => word === '')) {
          return { ...state, error: t('importSRPNumberOfWordsError') };
        }
        return state;
      };

      const validateCase = (
        state: { error: string; words: boolean[] },
        phrase: string,
      ) => {
        if (state.error) {
          return state;
        }
        if (hasUpperCase(phrase)) {
          return { ...state, error: t('invalidSeedPhraseCaseSensitive') };
        }
        return state;
      };

      const validateWords = (state: { error: string; words: boolean[] }) => {
        if (state.error) {
          return state;
        }

        const invalidWordIndices = state.words
          .map((invalid, index) => (invalid ? index + 1 : 0))
          .filter((index) => index !== 0);

        if (invalidWordIndices.length === 0) {
          return state;
        }
        if (invalidWordIndices.length === 1) {
          return {
            ...state,
            error: t('importSRPWordError', [invalidWordIndices[0]]),
          };
        }

        const lastIndex = invalidWordIndices.pop();
        const firstPart = invalidWordIndices.join(', ');
        return {
          ...state,
          error: t('importSRPWordErrorAlternative', [firstPart, lastIndex]),
        };
      };

      const validateMnemonic = (
        state: { error: string; words: boolean[] },
        phrase: string,
      ) => {
        if (state.error) {
          return state;
        }
        if (!isValidMnemonic(phrase)) {
          return { ...state, error: t('invalidSeedPhrase') };
        }
        return state;
      };

      const joinedDraftSrp = newDraftSrp.join(' ').trim();
      const invalidWords = Array(newDraftSrp.length).fill(false);
      let validationResult = validateSrp(newDraftSrp, invalidWords);
      validationResult = validateCompleteness(validationResult, newDraftSrp);
      validationResult = validateCase(validationResult, joinedDraftSrp);
      validationResult = validateWords(validationResult);
      validationResult = validateMnemonic(validationResult, joinedDraftSrp);

      setSecretRecoveryPhrase(newDraftSrp);
      setSrpError(validationResult.error);
      setInvalidSrpWords(validationResult.words);
    },
    [t, setSrpError, setSecretRecoveryPhrase],
  );

  const onSrpPaste = useCallback(
    (rawSrp) => {
      const parsedSrp = parseSecretRecoveryPhrase(rawSrp);
      let newDraftSrp = parsedSrp.split(' ');

      if (newDraftSrp.length > 24) {
        setPasteFailed(true);
        return;
      } else if (pasteFailed) {
        setPasteFailed(false);
      }

      let newNumberOfWords = numberOfWords;
      if (newDraftSrp.length !== numberOfWords) {
        if (newDraftSrp.length < 12) {
          newNumberOfWords = 12;
        } else if (newDraftSrp.length % 3 === 0) {
          newNumberOfWords = newDraftSrp.length;
        } else {
          newNumberOfWords =
            newDraftSrp.length + (3 - (newDraftSrp.length % 3));
        }
        setNumberOfWords(newNumberOfWords);
      }

      if (newDraftSrp.length < newNumberOfWords) {
        newDraftSrp = newDraftSrp.concat(
          new Array(newNumberOfWords - newDraftSrp.length).fill(''),
        );
      }
      onSrpChange(newDraftSrp);
      clearClipboard();
    },
    [numberOfWords, onSrpChange, pasteFailed, setPasteFailed],
  );

  const onSrpWordChange = useCallback(
    (index, newWord) => {
      if (pasteFailed) {
        setPasteFailed(false);
      }
      const newSrp = secretRecoveryPhrase.slice();
      newSrp[index] = newWord.trim();
      onSrpChange(newSrp);
    },
    [secretRecoveryPhrase, onSrpChange, pasteFailed],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Max}
      data-testid="import-srp-container"
    >
      <Text variant={TextVariant.bodyMd} marginTop={2}>
        {t('importSRPDescription')}
      </Text>

      <Box
        className="import-multi-srp__srp"
        width={BlockSize.Full}
        marginTop={4}
      >
        {Array.from({ length: numberOfWords }).map((_, index) => {
          const id = `import-multi-srp__srp-word-${index}`;
          return (
            <Box
              key={index}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
            >
              <Label
                className="import-srp__multi-srp-label"
                variant={TextVariant.bodyMdMedium}
                marginRight={4}
              >
                {index + 1}.
              </Label>
              <Box className="import-multi-srp__srp-word" marginBottom={4}>
                <TextField
                  id={id}
                  data-testid={id}
                  borderRadius={BorderRadius.LG}
                  error={invalidSrpWords[index]}
                  type={TextFieldType.Text}
                  onChange={(e) => {
                    e.preventDefault();
                    onSrpWordChange(index, e.target.value);
                  }}
                  value={secretRecoveryPhrase[index]}
                  autoComplete={false}
                  onPaste={(event: React.ClipboardEvent) => {
                    const newSrp = event.clipboardData.getData('text');

                    if (newSrp.trim().match(/\s/u)) {
                      event.preventDefault();
                      onSrpPaste(newSrp);
                    }
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
      {srpError ? (
        <BannerAlert
          severity={BannerAlertSeverity.Danger}
          description={srpError}
        />
      ) : null}

      {numberOfWords !== 24 && (
        <Box width={BlockSize.Full} marginTop={4}>
          <ButtonLink
            width={BlockSize.Full}
            loading={loading}
            onClick={async () => {
              setNumberOfWords(24);
            }}
          >
            {t('importNWordSRP', ['24'])}
          </ButtonLink>
        </Box>
      )}

      <Box width={BlockSize.Full} marginTop={4}>
        <ButtonPrimary
          width={BlockSize.Full}
          disabled={!isValidSrp}
          loading={loading}
          onClick={async () => {
            try {
              setLoading(true);
              await importWallet();
              onActionComplete(true);
              dispatch(setShowNewSrpAddedToast(true));
            } catch (e) {
              setSrpError(
                e instanceof Error ? e.message : 'An unknown error occurred',
              );
              setLoading(false);
            }
          }}
        >
          {t('importWallet')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};
