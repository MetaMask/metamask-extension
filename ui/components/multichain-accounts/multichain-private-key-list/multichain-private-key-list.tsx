import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
  TextVariant,
  TextColor,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../component-library';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import {
  getInternalAccountListSpreadByScopesByGroupId,
  getInternalAccountsFromGroupById,
} from '../../../selectors/multichain-accounts/account-tree';
import { verifyPassword, exportAccounts } from '../../../store/actions';

/**
 * Check if the account has the private key available according to its keyring type.
 * TODO: Add support for KeyringTypes.snap
 *
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
  const [password, setPassword] = useState<string>('');
  const [wrongPassword, setWrongPassword] = useState<boolean>(false);
  const [reveal, setReveal] = useState<boolean>(false);
  const [privateKeys, setPrivateKeys] = useState<Record<string, string>>({});

  const cleanStateVariables = useCallback(() => {
    setPrivateKeys({});
    setPassword('');
    setWrongPassword(false);
    setReveal(false);
  }, []);

  useEffect(
    () => () => {
      // Clean state variables on unmount
      cleanStateVariables();
    },
    [cleanStateVariables],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, handleCopy] = useCopyToClipboard();

  const accountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const accounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, groupId),
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [setPassword],
  );

  const validatePassword = useCallback(async () => {
    try {
      await verifyPassword(password);
      setWrongPassword(false);
      setReveal(true);
    } catch (error) {
      setWrongPassword(true);
      setReveal(false);
    }
  }, [password]);

  const unlockPrivateKeys = useCallback(async () => {
    const pkAccounts = accounts.filter((account: InternalAccount) =>
      hasPrivateKeyAvailable(account),
    );

    const addresses = pkAccounts.map((account) => account.address);

    const pks = (await dispatch(
      exportAccounts(password, addresses),
    )) as unknown as string[];

    const privateKeyMap = await addresses.reduce(
      (acc, address, index) => {
        acc[address] = pks[index];
        return acc;
      },
      {} as Record<string, string>,
    );

    setPrivateKeys(privateKeyMap);
  }, [accounts, dispatch, password]);

  const onSubmit = useCallback(async () => {
    await validatePassword();
    await unlockPrivateKeys();
  }, [validatePassword, unlockPrivateKeys]);

  const onCancel = useCallback(() => {
    cleanStateVariables();
    goBack();
  }, [cleanStateVariables, goBack]);

  const renderedPasswordInput = useMemo(
    () => (
      <Box paddingTop={8} paddingBottom={4}>
        <Box>
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
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
              variant={TextVariant.bodySm}
              color={TextColor.errorDefault}
              data-testid="wrong-password-msg"
            >
              {t('wrongPassword')}
            </Text>
          ) : null}
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
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

  const renderAddressItem = useCallback(
    (
      item: {
        scope: CaipChainId;
        account: InternalAccount;
        networkName: string;
      },
      index: number,
    ): React.JSX.Element => {
      const privateKey = privateKeys[item.account.address];
      if (!privateKey) {
        return <></>;
      }

      const handleCopyClick = () => {
        handleCopy(privateKey);
      };

      return (
        <MultichainAddressRow
          key={`${item.account.address}-${item.scope}-${index}`}
          chainId={item.scope}
          networkName={item.networkName}
          address={item.account.address}
          copyActionParams={{
            message: t('multichainAccountPrivateKeyCopied'),
            callback: handleCopyClick,
          }}
        />
      );
    },
    [handleCopy, privateKeys, t],
  );

  const renderedRows = useMemo(() => {
    return accountsSpreadByNetworkByGroupId.map((item, index) =>
      renderAddressItem(item, index),
    );
  }, [accountsSpreadByNetworkByGroupId, renderAddressItem]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      data-testid="multichain-private-keyring-list"
    >
      {reveal ? renderedRows : renderedPasswordInput}
    </Box>
  );
};

export { MultichainPrivateKeyList };
