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
import { setShowNewSRPAddedToast } from '../../../app/toast-master/utils';
import { parseSecretRecoveryPhrase } from '../../../app/srp-input/parse-secret-recovery-phrase';
import { clearClipboard } from '../../../../helpers/utils/util';

const hasUpperCase = (draftSrp: string) => {
  return draftSrp !== draftSrp.toLowerCase();
};

const defaultNumberOfWords = 12;

export const ImportSRP = ({
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
  const [invalidSRPWords, setInvalidSRPWords] = useState(
    Array(defaultNumberOfWords).fill(false),
  );

  const [loading, setLoading] = useState(false);

  async function importWallet() {
    const joinedSrp = secretRecoveryPhrase.join(' ');
    if (joinedSrp) {
      await dispatch(actions.addNewMnemonicToVault(joinedSrp));
    }
  }

  const isValidSRP = useMemo(() => {
    return isValidMnemonic(secretRecoveryPhrase.join(' '));
  }, [secretRecoveryPhrase]);

  const onSrpChange = useCallback(
    (newDraftSrp: string[]) => {
      let newSrpError = '';
      const joinedDraftSrp = newDraftSrp.join(' ').trim();
      let invalidWords = Array(newDraftSrp.length).fill(false);

      if (newDraftSrp.some((word) => word !== '')) {
        invalidWords = newDraftSrp.map((word) => !wordlist.includes(word));

        if (newDraftSrp.some((word) => word === '')) {
          newSrpError = t('seedPhraseReq');
        } else if (hasUpperCase(joinedDraftSrp)) {
          newSrpError = t('invalidSeedPhraseCaseSensitive');
        } else if (newDraftSrp.length !== numberOfWords) {
          newSrpError = t('invalidSeedPhrase');
        } else if (invalidWords.some((word) => word === true)) {
          const invalidWordIndex = invalidWords.reduce((acc, word, index) => {
            if (word) {
              // We add 1 to the index because the index is 0-based
              // This is displayed to the user to show which word in the list is incorrect.
              acc.push(index + 1);
            }
            return acc;
          }, []);
          if (invalidWordIndex.length === 1) {
            newSrpError = t('importSRPWordError', [invalidWordIndex.pop()]);
          } else if (invalidWordIndex.length >= 2) {
            const firstPartOfError = invalidWordIndex.slice(0, -1).join(', ');
            newSrpError = t('importSRPWordErrorAlternative', [
              firstPartOfError,
              invalidWordIndex.pop(),
            ]);
          }
        } else if (!isValidMnemonic(joinedDraftSrp)) {
          newSrpError = t('invalidSeedPhrase');
        }
      }
      setSecretRecoveryPhrase(newDraftSrp);
      setSrpError(newSrpError);
      setInvalidSRPWords(invalidWords);
    },
    [t, setSrpError, setSecretRecoveryPhrase, invalidSRPWords, numberOfWords],
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
    >
      <Text variant={TextVariant.bodyMd} marginTop={2}>
        {t('importSRPDescription')}
      </Text>

      <Box className="import-srp__srp" width={BlockSize.Full} marginTop={4}>
        {Array.from({ length: numberOfWords }).map((_, index) => {
          const id = `import-srp__srp-word-${index}`;
          return (
            <Box className="import-srp__srp-word" key={index} marginBottom={4}>
              <Label variant={TextVariant.bodyMdMedium} marginRight={4}>
                {index + 1}.
              </Label>
              <TextField
                id={id}
                data-testid={id}
                borderRadius={BorderRadius.LG}
                error={invalidSRPWords[index]}
                type={TextFieldType.Text}
                onChange={(e) => {
                  e.preventDefault();
                  onSrpWordChange(index, e.target.value);
                }}
                value={secretRecoveryPhrase[index]}
                autoComplete={false}
                onPaste={(event) => {
                  const newSrp = event.clipboardData.getData('text');

                  if (newSrp.trim().match(/\s/u)) {
                    event.preventDefault();
                    onSrpPaste(newSrp);
                  }
                }}
              />
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
          disabled={!isValidSRP}
          loading={loading}
          onClick={async () => {
            try {
              setLoading(true);
              await importWallet();
              onActionComplete(true);
              dispatch(setShowNewSRPAddedToast(true));
            } catch (e) {
              console.error('error', e);
            }
          }}
        >
          {t('importWallet')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};
