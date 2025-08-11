import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isValidMnemonic } from '@ethersproject/hdnode';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';
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
  ButtonIcon,
  IconName,
} from '../../../components/component-library';
import {
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
  BorderRadius,
  BackgroundColor,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
import { parseSecretRecoveryPhrase } from '../../../components/app/srp-input/parse-secret-recovery-phrase';
import { clearClipboard } from '../../../helpers/utils/util';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Header, Page } from '../../../components/multichain/pages/page';
import ShowHideToggle from '../../../components/ui/show-hide-toggle';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  getMetaMaskHdKeyrings,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from '../../../components/app/password-outdated-modal';
import { MetaMaskReduxDispatch } from '../../../store/store';
import { getMnemonicUtil } from '../../../../shared/lib/mnemonic/mnemonic';

const hasUpperCase = (draftSrp: string) => {
  return draftSrp !== draftSrp.toLowerCase();
};

const defaultNumberOfWords = 12;

export const ImportSrp = () => {
  const t = useI18nContext();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const [srpError, setSrpError] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState(
    Array(defaultNumberOfWords).fill(''),
  );
  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);
  const [invalidSrpWords, setInvalidSrpWords] = useState(
    Array(defaultNumberOfWords).fill(false),
  );
  const [showSrp, setShowSrp] = useState(
    new Array(defaultNumberOfWords).fill(false),
  );
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const newHdEntropyIndex = hdKeyrings.length;

  const [loading, setLoading] = useState(false);

  // Providing duplicate SRP throws an error in metamask-controller, which results in a warning in the UI
  // We want to hide the warning when the component unmounts
  useEffect(() => {
    return () => {
      dispatch(actions.hideWarning());
    };
  }, [dispatch]);

  async function importWallet() {
    if (isSocialLoginEnabled) {
      const isPasswordOutdated = await dispatch(
        actions.checkIsSeedlessPasswordOutdated(true),
      );
      if (isPasswordOutdated) {
        return;
      }
    }

    const joinedSrp = secretRecoveryPhrase.join(' ');
    if (joinedSrp) {
      const result = (await dispatch(
        actions.importMnemonicToVault(joinedSrp),
      )) as unknown as {
        newAccountAddress: string;
        discoveredAccounts: { bitcoin: number; solana: number };
      };

      const { discoveredAccounts } = result;

      // Clear the secret recovery phrase after importing
      setSecretRecoveryPhrase(Array(defaultNumberOfWords).fill(''));

      // Track the event with the discovered accounts
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      trackEvent({
        event: MetaMetricsEventName.ImportSecretRecoveryPhraseCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: newHdEntropyIndex,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_solana_accounts_discovered: discoveredAccounts?.solana,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_bitcoin_accounts_discovered: discoveredAccounts?.bitcoin,
        },
      });
    }

    history.push(DEFAULT_ROUTE);
    dispatch(setShowNewSrpAddedToast(true));
  }

  const isValidSrp = useMemo(() => {
    return isValidMnemonic(secretRecoveryPhrase.join(' '));
  }, [secretRecoveryPhrase]);

  const hasEmptyWordsOrIncorrectLength = useMemo(() => {
    return (
      secretRecoveryPhrase.some((word) => word === '') ||
      secretRecoveryPhrase.length !== numberOfWords
    );
  }, [secretRecoveryPhrase, numberOfWords]);

  const onSrpChange = useCallback(
    async (newDraftSrp: string[]) => {
      const mnemonicUtil = await getMnemonicUtil();
      const validateSrp = (phrase: string[], words: boolean[]) => {
        if (!phrase.some((word) => word !== '')) {
          return { error: '', words };
        }

        const state = {
          error: '',
          words: phrase.map((word) => !mnemonicUtil.isValidWord(word)),
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

      if (newDraftSrp.filter((word) => word !== '').length === numberOfWords) {
        const joinedDraftSrp = newDraftSrp.join(' ').trim();
        const invalidWords = Array(newDraftSrp.length).fill(false);
        let validationResult = validateSrp(newDraftSrp, invalidWords);
        validationResult = validateCase(validationResult, joinedDraftSrp);
        validationResult = validateCompleteness(validationResult, newDraftSrp);
        validationResult = validateWords(validationResult);
        validationResult = validateMnemonic(validationResult, joinedDraftSrp);
        setSrpError(validationResult.error);
        setInvalidSrpWords(validationResult.words);
      }

      setSecretRecoveryPhrase(newDraftSrp);
    },
    [t, setSrpError, setSecretRecoveryPhrase, numberOfWords],
  );

  const toggleShowSrp = useCallback((index) => {
    setShowSrp((currentShowSrp) => {
      const newShowSrp = currentShowSrp.slice();
      if (newShowSrp[index]) {
        newShowSrp[index] = false;
      } else {
        newShowSrp.fill(false);
        newShowSrp[index] = true;
      }
      return newShowSrp;
    });
  }, []);

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
      setShowSrp(new Array(newNumberOfWords).fill(false));
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

  useEffect(() => {
    if (isSeedlessPasswordOutdated) {
      setLoading(false);
    }
  }, [isSeedlessPasswordOutdated]);

  return (
    <Page className="import-srp__multi-srp">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="back"
            iconName={IconName.ArrowLeft}
            onClick={() => {
              history.push(DEFAULT_ROUTE);
            }}
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel="close"
            iconName={IconName.Close}
            onClick={() => {
              history.push(DEFAULT_ROUTE);
            }}
          />
        }
        paddingLeft={0}
        paddingRight={0}
      >
        {t('importSecretRecoveryPhrase')}
      </Header>
      {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        height={BlockSize.Max}
        data-testid="import-srp-container"
      >
        <Text variant={TextVariant.bodyMd} marginTop={2}>
          {t('importSRPDescription')}
        </Text>

        <Box className="import-srp__multi-srp__srp-inner-container">
          <Box
            width={BlockSize.Full}
            marginTop={4}
            className="import-srp__multi-srp__srp"
          >
            {Array.from({ length: numberOfWords }).map((_, index) => {
              const id = `import-srp__multi-srp__srp-word-${index}`;
              return (
                <Box
                  key={index}
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  width={BlockSize.Full}
                  marginBottom={4}
                >
                  <Label
                    className="import-srp__multi-srp__label"
                    variant={TextVariant.bodyMdMedium}
                    marginRight={4}
                  >
                    {index + 1}.
                  </Label>
                  <Box
                    className="import-srp__multi-srp__srp-word"
                    flexDirection={FlexDirection.Row}
                    alignItems={AlignItems.center}
                    width={BlockSize.Full}
                  >
                    <TextField
                      id={id}
                      data-testid={id}
                      width={BlockSize.Full}
                      borderRadius={BorderRadius.LG}
                      error={invalidSrpWords[index]}
                      type={
                        showSrp[index]
                          ? TextFieldType.Text
                          : TextFieldType.Password
                      }
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
                  <ShowHideToggle
                    id={`${id}-checkbox`}
                    ariaLabelHidden={t('srpWordHidden')}
                    ariaLabelShown={t('srpWordShown')}
                    shown={showSrp[index]}
                    data-testid={`${id}-checkbox`}
                    onChange={() => toggleShowSrp(index)}
                    title={t('srpToggleShow')}
                  />
                </Box>
              );
            })}
          </Box>
          {srpError ? (
            <BannerAlert
              severity={BannerAlertSeverity.Danger}
              description={srpError}
              actionButtonLabel={t('clear')}
              actionButtonOnClick={async () => {
                await onSrpChange(Array(defaultNumberOfWords).fill(''));
                setSrpError('');
              }}
              data-testid="bannerAlert"
            />
          ) : null}

          {
            <Box width={BlockSize.Full} marginTop={4}>
              <ButtonLink
                width={BlockSize.Full}
                onClick={async () => {
                  setNumberOfWords(numberOfWords === 12 ? 24 : 12);
                  setSrpError('');
                  setInvalidSrpWords(
                    Array(numberOfWords === 12 ? 24 : 12).fill(false),
                  );
                  setShowSrp(
                    new Array(numberOfWords === 12 ? 24 : 12).fill(false),
                  );
                }}
                data-testid="import-srp__multi-srp__switch-word-count-button"
              >
                {t('importNWordSRP', [numberOfWords === 12 ? '24' : '12'])}
              </ButtonLink>
            </Box>
          }
        </Box>
        <Box
          className="import-srp__multi-srp__import-button"
          marginTop={4}
          paddingBottom={6}
          paddingTop={2}
          backgroundColor={BackgroundColor.backgroundDefault}
        >
          <ButtonPrimary
            width={BlockSize.Full}
            disabled={!isValidSrp || hasEmptyWordsOrIncorrectLength}
            loading={loading}
            onClick={async () => {
              trace({ name: TraceName.ImportSrp });
              try {
                setLoading(true);
                await dispatch(actions.lockAccountSyncing());
                await importWallet();
              } catch (e) {
                setSrpError(
                  e instanceof Error
                    ? e.message
                    : t('importSecretRecoveryPhraseUnknownError'),
                );
              } finally {
                setLoading(false);
                endTrace({ name: TraceName.ImportSrp });
                await dispatch(actions.unlockAccountSyncing());
              }
            }}
          >
            {t('importWallet')}
          </ButtonPrimary>
        </Box>
      </Box>
    </Page>
  );
};
