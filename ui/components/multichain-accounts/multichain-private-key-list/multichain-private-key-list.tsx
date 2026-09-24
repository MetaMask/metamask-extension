import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { EthScope, isEvmAccountType } from '@metamask/keyring-api';
import { type InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Text,
  TextColor,
  TextVariant,
  Box,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BlockSize } from '../../../helpers/constants/design-system';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../component-library';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getInternalAccountsFromGroupById } from '../../../selectors/multichain-accounts/account-tree';
import { verifyPassword, exportAccounts } from '../../../store/actions';
import {
  useIsPasskeyActive,
  useIsPasskeyIncompatibleInSidepanel,
} from '../../../hooks/usePasskeyAvailability';
import { cancelPasskeyCeremony } from '../../../../shared/lib/passkey';
import { getPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  createSentryError,
  getErrorMessage,
} from '../../../../shared/lib/error';
import { captureException } from '../../../../shared/lib/sentry';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
  MetaMetricsEventVerificationMethod,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { MINUTE } from '../../../../shared/constants/time';
import { MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { PasskeyVerification } from '../../app/passkey-verification';
import { useDispatch } from '../../../store/hooks';
import { usePasskeyPrivateKeyExport } from '../../../hooks/passkey/usePasskeyPrivateKeyExport';
import { MultichainPrivateKeyRow } from './multichain-private-key-row';

const VERIFY_PASSKEY_SCREEN = 'VERIFY_PASSKEY_SCREEN';
const VERIFY_PASSWORD_SCREEN = 'VERIFY_PASSWORD_SCREEN';

/**
 * Check if the account has the private key available according to its keyring type.
 * @param account - The internal account to check.
 * @returns True if the private key is available, false otherwise.
 */
const hasPrivateKeyAvailable = (account: InternalAccount) =>
  account.metadata.keyring.type === KeyringTypes.hd ||
  account.metadata.keyring.type === KeyringTypes.simple;

export type MultichainPrivateKeyListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
  /**
   * Function to go back to the previous page.
   */
  goBack: () => void;
};

const MultichainPrivateKeyList = ({
  groupId,
  goBack,
}: MultichainPrivateKeyListProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const exportAccountsWithPasskey = usePasskeyPrivateKeyExport();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const [password, setPassword] = useState<string>('');
  const [wrongPassword, setWrongPassword] = useState<boolean>(false);
  const [reveal, setReveal] = useState<boolean>(false);
  const [privateKeys, setPrivateKeys] = useState<Record<string, string>>({});

  const isPasskeyActive = useIsPasskeyActive();
  const isPasskeyIncompatibleInSidepanel =
    useIsPasskeyIncompatibleInSidepanel();

  const [screen, setScreen] = useState<string>(
    isPasskeyActive && !isPasskeyIncompatibleInSidepanel
      ? VERIFY_PASSKEY_SCREEN
      : VERIFY_PASSWORD_SCREEN,
  );

  const cleanStateVariables = useCallback(() => {
    setPrivateKeys({});
    setPassword('');
    setWrongPassword(false);
    setReveal(false);
    setScreen(VERIFY_PASSWORD_SCREEN);
  }, []);

  useEffect(
    () => () => {
      // Clean state variables on unmount
      cleanStateVariables();
    },
    [cleanStateVariables],
  );

  // useCopyToClipboard analysis: Copies one of your private keys
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: MINUTE });

  const accounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, groupId),
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [setPassword],
  );

  const exportableAccounts = useMemo(
    () =>
      accounts.filter(
        (account: InternalAccount) =>
          hasPrivateKeyAvailable(account) && isEvmAccountType(account.type),
      ),
    [accounts],
  );

  const exportableAddresses = useMemo(
    () => exportableAccounts.map((account) => account.address),
    [exportableAccounts],
  );

  const buildPrivateKeyMap = useCallback(
    (privateKeysList: string[]) =>
      exportableAddresses.reduce(
        (acc, address, index) => {
          acc[address] = privateKeysList[index];
          return acc;
        },
        {} as Record<string, string>,
      ),
    [exportableAddresses],
  );

  const onSubmit = useCallback(async () => {
    let passwordVerified = false;

    trackEvent(
      createEventBuilder(MetaMetricsEventName.KeyExportRequested)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Pkey,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: MetaMetricsEventVerificationMethod.Password,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );

    try {
      await verifyPassword(password);
      passwordVerified = true;
      setWrongPassword(false);
      trace({
        name: TraceName.ShowAccountPrivateKeyList,
        op: TraceOperation.AccountUi,
      });

      const privateKeysList = (await dispatch(
        exportAccounts(password, exportableAddresses),
      )) as unknown as string[];
      setPrivateKeys(buildPrivateKeyMap(privateKeysList));
      setReveal(true);

      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportRevealed)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Pkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verification_method: MetaMetricsEventVerificationMethod.Password,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
    } catch (error) {
      setWrongPassword(!passwordVerified);
      setReveal(false);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportFailed)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Pkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verification_method: MetaMetricsEventVerificationMethod.Password,
            reason: getErrorMessage(error),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
    }
  }, [
    buildPrivateKeyMap,
    createEventBuilder,
    dispatch,
    exportableAddresses,
    hdEntropyIndex,
    password,
    trackEvent,
  ]);

  const handleRevealWithPasskey = useCallback(
    async (authenticationResponse: PasskeyAuthenticationResponse) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportRequested)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Pkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verification_method: MetaMetricsEventVerificationMethod.Passkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );

      try {
        trace({
          name: TraceName.ShowAccountPrivateKeyList,
          op: TraceOperation.AccountUi,
        });
        const pks = await exportAccountsWithPasskey(
          authenticationResponse,
          exportableAddresses,
        );

        const exportedPrivateKeys = buildPrivateKeyMap(pks);
        setPrivateKeys(exportedPrivateKeys);
        setReveal(true);

        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportRevealed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Pkey,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              verification_method: MetaMetricsEventVerificationMethod.Passkey,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            })
            .build(),
        );
      } catch (error) {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportFailed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Pkey,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              verification_method: MetaMetricsEventVerificationMethod.Passkey,
              reason: getPasskeyErrorCode(error),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            })
            .build(),
        );
        captureException(
          createSentryError('Export private keys with passkey failed', error),
        );
        endTrace({
          name: TraceName.ShowAccountPrivateKeyList,
        });
        // Fall back to password verification on any passkey reveal failure.
        setScreen(VERIFY_PASSWORD_SCREEN);
      }
    },
    [
      buildPrivateKeyMap,
      createEventBuilder,
      exportAccountsWithPasskey,
      exportableAddresses,
      hdEntropyIndex,
      trackEvent,
    ],
  );

  const handleUsePassword = useCallback(() => {
    setScreen(VERIFY_PASSWORD_SCREEN);
  }, []);

  const openInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(
      MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE,
      `accountGroupId=${encodeURIComponent(groupId)}`,
    );
  }, [groupId]);

  const onCancel = useCallback(() => {
    if (!reveal) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportCanceled)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Pkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
    }
    cleanStateVariables();
    goBack();
  }, [
    cleanStateVariables,
    createEventBuilder,
    goBack,
    hdEntropyIndex,
    reveal,
    trackEvent,
  ]);

  const renderedPasswordInput = useMemo(
    () => (
      <Box paddingTop={8} paddingBottom={4} paddingHorizontal={4}>
        <Box>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {t('enterYourPassword')}
          </Text>
          <TextField
            type={TextFieldType.Password}
            placeholder={t('password')}
            size={TextFieldSize.Lg}
            value={password}
            onChange={handlePasswordChange}
            error={wrongPassword}
            width={BlockSize.Full}
            testId="multichain-private-key-password-input"
          />
          {wrongPassword ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              data-testid="wrong-password-msg"
            >
              {t('wrongPassword')}
            </Text>
          ) : null}
        </Box>
        <Box
          className="flex"
          flexDirection={BoxFlexDirection.Row}
          gap={4}
          paddingBottom={2}
          paddingTop={8}
        >
          <Button
            block
            data-testid="cancel-button"
            onClick={onCancel}
            size={ButtonSize.Lg}
            variant={ButtonVariant.Secondary}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            data-testid="confirm-button"
            onClick={onSubmit}
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
          >
            {t('confirm')}
          </Button>
        </Box>
      </Box>
    ),
    [handlePasswordChange, onCancel, onSubmit, password, t, wrongPassword],
  );

  const privateKeySections = useMemo(
    () =>
      exportableAccounts.flatMap((account) => {
        const privateKey = privateKeys[account.address];
        if (!privateKey) {
          return [];
        }

        return [
          {
            account,
            chainId: EthScope.Mainnet,
            networkName: t('ethereumAndEvms'),
            privateKey,
          },
        ];
      }),
    [exportableAccounts, privateKeys, t],
  );

  const handlePrivateKeyCopy = useCallback(
    (privateKey: string) => {
      handleCopy(privateKey);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportCopied)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Pkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            copy_method: 'clipboard',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
    },
    [createEventBuilder, handleCopy, hdEntropyIndex, trackEvent],
  );

  const renderedRows = useMemo(
    () =>
      privateKeySections.map(
        ({ account, chainId, networkName, privateKey }) => (
          <MultichainPrivateKeyRow
            key={account.id}
            address={account.address}
            chainId={chainId}
            networkName={networkName}
            onCopy={() => handlePrivateKeyCopy(privateKey)}
            privateKey={privateKey}
          />
        ),
      ),
    [handlePrivateKeyCopy, privateKeySections],
  );

  useEffect(() => {
    if (reveal) {
      endTrace({
        name: TraceName.ShowAccountPrivateKeyList,
      });
    }
  }, [reveal]);

  const renderUnrevealedContent = () => {
    if (screen === VERIFY_PASSKEY_SCREEN) {
      return (
        <PasskeyVerification
          flow="export-private-keys"
          troubleshootLocation="export-private-keys"
          onOpenFullScreen={openInFullScreen}
          onVerified={handleRevealWithPasskey}
          onCeremonyFailed={handleUsePassword}
          onUsePassword={handleUsePassword}
        />
      );
    }
    return renderedPasswordInput;
  };

  return (
    <Box
      className={reveal ? 'flex pt-4' : 'flex'}
      flexDirection={BoxFlexDirection.Column}
      data-testid="multichain-private-keyring-list"
    >
      {reveal ? renderedRows : renderUnrevealedContent()}
    </Box>
  );
};

export { MultichainPrivateKeyList };
