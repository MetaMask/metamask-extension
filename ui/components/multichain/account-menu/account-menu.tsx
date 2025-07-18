import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  IconSize,
  Modal,
  ModalOverlay,
  Text,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header';

import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  getIsWatchEthereumAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  getIsBitcoinSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getHdKeyringOfSelectedAccountOrPrimaryKeyring,
  ///: BEGIN:ONLY_INCLUDE_IF(solana,bitcoin)
  getMetaMaskHdKeyrings,
  ///: END:ONLY_INCLUDE_IF
  getManageInstitutionalWallets,
  getHDEntropyIndex,
  getIsMultichainAccountsState1Enabled,
} from '../../../selectors';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
} from '../../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import {
  ACCOUNT_WATCHER_NAME,
  ACCOUNT_WATCHER_SNAP_ID,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/lib/snap-keyring/account-watcher-snap';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import {
  MultichainWalletSnapClient,
  useMultichainWalletSnapClient,
  WalletClientType,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';
///: END:ONLY_INCLUDE_IF
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { CreateEthAccount } from '../create-eth-account';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { CreateSnapAccount } from '../create-snap-account';
import { CreateAccountSnapOptions } from '../../../../shared/lib/accounts';
///: END:ONLY_INCLUDE_IF
import { ImportAccount } from '../import-account';
import { SrpList } from '../multi-srp/srp-list';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/institutional-wallet-snap';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';

// TODO: Should we use an enum for this instead?
export const ACTION_MODES = {
  // Displays the search box and account list
  LIST: '',
  // Displays the Add, Import, Hardware accounts
  MENU: 'menu',
  // Displays the add account form controls
  ADD: 'add',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  // Displays the add account form controls (for watch-only account)
  ADD_WATCH_ONLY: 'add-watch-only',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  // Displays the add account form controls (for bitcoin account)
  ADD_BITCOIN: 'add-bitcoin',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  // Displays the add account form controls (for solana account)
  ADD_SOLANA: 'add-solana',
  ///: END:ONLY_INCLUDE_IF
  // Displays the import account form controls
  IMPORT: 'import',
  CREATE_SRP: 'create-srp',
  IMPORT_SRP: 'import-srp',
  SELECT_SRP: 'select-srp',
} as const;

export type ActionMode = (typeof ACTION_MODES)[keyof typeof ACTION_MODES];

///: BEGIN:ONLY_INCLUDE_IF(multichain)
export const SNAP_CLIENT_CONFIG_MAP: Record<
  string,
  { clientType: WalletClientType | null; chainId: CaipChainId | null }
> = {
  [ACTION_MODES.ADD_BITCOIN]: {
    clientType: WalletClientType.Bitcoin,
    chainId: MultichainNetworks.BITCOIN,
  },
  [ACTION_MODES.ADD_SOLANA]: {
    clientType: WalletClientType.Solana,
    chainId: MultichainNetworks.SOLANA,
  },
};
///: END:ONLY_INCLUDE_IF(multichain)
/**
 * Gets the title for a given action mode.
 *
 * @param t - Function to translate text.
 * @param actionMode - An action mode.
 * @param isMultichainAccountsState1Enabled - Whether the multichain accounts state 1 is enabled.
 * @returns The title for this action mode.
 */
export const getActionTitle = (
  t: (text: string, args?: string[]) => string,
  actionMode: ActionMode,
  isMultichainAccountsState1Enabled: boolean,
) => {
  switch (actionMode) {
    case ACTION_MODES.ADD:
      return t('addAccountFromNetwork', [t('networkNameEthereum')]);
    case ACTION_MODES.MENU:
      return t('addAccount');
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    case ACTION_MODES.ADD_WATCH_ONLY:
      return t('addAccountFromNetwork', [t('networkNameEthereum')]);
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    case ACTION_MODES.ADD_BITCOIN:
      return t('addAccountFromNetwork', [t('networkNameBitcoin')]);
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    case ACTION_MODES.ADD_SOLANA:
      return t('addAccountFromNetwork', [t('networkNameSolana')]);
    ///: END:ONLY_INCLUDE_IF
    case ACTION_MODES.IMPORT:
      return t('importPrivateKey');
    case ACTION_MODES.CREATE_SRP:
      return t('createSecretRecoveryPhrase');
    case ACTION_MODES.IMPORT_SRP:
      return t('importSecretRecoveryPhrase');
    case ACTION_MODES.SELECT_SRP:
      return t('selectSecretRecoveryPhrase');
    default:
      return isMultichainAccountsState1Enabled
        ? t('accounts')
        : t('selectAnAccount');
  }
};

type AccountMenuProps = {
  onClose: () => void;
  showAccountCreation?: boolean;
  children?: React.ReactNode;
};

export const AccountMenu = ({
  onClose,
  showAccountCreation = true,
  children,
}: AccountMenuProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  useEffect(() => {
    endTrace({ name: TraceName.AccountList });
  }, []);
  const history = useHistory();
  const isMultichainAccountsState1Enabled = useSelector(
    getIsMultichainAccountsState1Enabled,
  );

  // sync SRPs list when menu opens
  useSyncSRPs();

  const [actionMode, setActionMode] = useState<ActionMode>(ACTION_MODES.LIST);
  const [previousActionMode, setPreviousActionMode] = useState<ActionMode>(
    ACTION_MODES.LIST,
  );
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const isAddWatchEthereumAccountEnabled = useSelector(
    getIsWatchEthereumAccountEnabled,
  );

  const handleAddWatchAccount = useCallback(async () => {
    await trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: ACCOUNT_WATCHER_SNAP_ID,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_name: ACCOUNT_WATCHER_NAME,
        location: 'Main Menu',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    onClose();
    history.push(`/snaps/view/${encodeURIComponent(ACCOUNT_WATCHER_SNAP_ID)}`);
  }, [trackEvent, hdEntropyIndex, onClose, history]);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  const bitcoinWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Bitcoin,
  );
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana,bitcoin)
  const [primaryKeyring] = useSelector(getMetaMaskHdKeyrings);

  const handleMultichainSnapAccountCreation = async (
    client: MultichainWalletSnapClient,
    _options: CreateAccountSnapOptions,
    action: ActionMode,
  ) => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: client.getSnapId(),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_name: client.getSnapName(),
        location: 'Main Menu',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_caip: _options.scope,
      },
    });

    return setActionMode(action);
  };
  ///: END:ONLY_INCLUDE_IF
  const manageInstitutionalWallets = useSelector(getManageInstitutionalWallets);

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const hdKeyring = useSelector(getHdKeyringOfSelectedAccountOrPrimaryKeyring);
  const [selectedKeyringId, setSelectedKeyringId] = useState(
    hdKeyring.metadata.id,
  );

  const title = useMemo(
    () =>
      getActionTitle(
        t as (text: string) => string,
        actionMode,
        Boolean(isMultichainAccountsState1Enabled),
      ),
    [actionMode, t, isMultichainAccountsState1Enabled],
  );

  // eslint-disable-next-line no-empty-function
  let onBack;
  if (actionMode !== ACTION_MODES.LIST) {
    if (actionMode === ACTION_MODES.MENU) {
      onBack = () => setActionMode(ACTION_MODES.LIST);
    } else if (actionMode === ACTION_MODES.SELECT_SRP) {
      onBack = () => setActionMode(previousActionMode);
    } else {
      onBack = () => setActionMode(ACTION_MODES.MENU);
    }
  }

  const onActionComplete = useCallback(
    async (confirmed: boolean) => {
      if (confirmed) {
        onClose();
      } else {
        setActionMode(ACTION_MODES.LIST);
      }
    },
    [onClose, setActionMode],
  );

  const onSelectSrp = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        button_type: 'picker',
      },
    });
    setPreviousActionMode(actionMode);
    setActionMode(ACTION_MODES.SELECT_SRP);
  }, [setActionMode, actionMode, trackEvent]);

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const { clientType, chainId } = SNAP_CLIENT_CONFIG_MAP[actionMode] || {
    clientType: null,
    chainId: null,
  };
  ///: END:ONLY_INCLUDE_IF(multichain)

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        className="multichain-account-menu-popover"
        modalDialogProps={{
          className: 'multichain-account-menu-popover__dialog',
          padding: 0,
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader padding={4} onClose={onClose} onBack={onBack}>
          {title}
        </ModalHeader>
        {actionMode === ACTION_MODES.ADD ? (
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <CreateEthAccount
              onActionComplete={onActionComplete}
              selectedKeyringId={selectedKeyringId}
              onSelectSrp={onSelectSrp}
            />
          </Box>
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(multichain)
          clientType && chainId ? (
            <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
              <CreateSnapAccount
                onActionComplete={onActionComplete}
                selectedKeyringId={selectedKeyringId}
                onSelectSrp={onSelectSrp}
                clientType={clientType}
                chainId={chainId}
              />
            </Box>
          ) : null
          ///: END:ONLY_INCLUDE_IF(multichain)
        }
        {actionMode === ACTION_MODES.IMPORT ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
            paddingTop={0}
          >
            <ImportAccount onActionComplete={onActionComplete} />
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.SELECT_SRP && (
          <SrpList
            onActionComplete={(keyringId: string) => {
              setSelectedKeyringId(keyringId);
              setActionMode(previousActionMode);
            }}
          />
        )}

        {/* Add / Import / Hardware Menu */}
        {actionMode === ACTION_MODES.MENU ? (
          <Box padding={4}>
            <Text
              variant={TextVariant.bodySmMedium}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('createNewAccountHeader')}
            </Text>
            <Box>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Add}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      account_type: MetaMetricsEventAccountType.Default,
                      location: 'Main Menu',
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  setActionMode(ACTION_MODES.ADD);
                }}
                data-testid="multichain-account-menu-popover-add-account"
              >
                {t('addNewEthereumAccountLabel')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(solana)
              solanaSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      await handleMultichainSnapAccountCreation(
                        solanaWalletSnapClient,
                        {
                          scope: MultichainNetworks.SOLANA,
                          entropySource: primaryKeyring.metadata.id,
                        },
                        ACTION_MODES.ADD_SOLANA,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-solana-account"
                  >
                    {t('addNewSolanaAccountLabel')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
              bitcoinSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      return await handleMultichainSnapAccountCreation(
                        bitcoinWalletSnapClient,
                        {
                          scope: MultichainNetworks.BITCOIN,
                          entropySource: primaryKeyring.metadata.id,
                        },
                        ACTION_MODES.ADD_BITCOIN,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-btc-account"
                  >
                    {t('addBitcoinAccountLabel')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }

            <Text
              variant={TextVariant.bodySmMedium}
              marginTop={4}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('importWalletOrAccountHeader')}
            </Text>
            {
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Wallet}
                  startIconProps={{ size: IconSize.Md }}
                  onClick={() => {
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event:
                        MetaMetricsEventName.ImportSecretRecoveryPhraseClicked,
                    });
                    history.push(IMPORT_SRP_ROUTE);
                    onClose();
                  }}
                  data-testid="multichain-account-menu-popover-import-srp"
                >
                  {t('secretRecoveryPhrase')}
                </ButtonLink>
              </Box>
            }

            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Key}
                startIconProps={{ size: IconSize.Md }}
                data-testid="multichain-account-menu-popover-add-imported-account"
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      account_type: MetaMetricsEventAccountType.Imported,
                      location: 'Main Menu',
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  setActionMode(ACTION_MODES.IMPORT);
                }}
              >
                {t('importPrivateKey')}
              </ButtonLink>
            </Box>
            <Text
              variant={TextVariant.bodySmMedium}
              marginTop={4}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('connectAnAccountHeader')}
            </Text>
            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Hardware}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => {
                  onClose();
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      account_type: MetaMetricsEventAccountType.Hardware,
                      location: 'Main Menu',
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                    global.platform.openExtensionInBrowser?.(
                      CONNECT_HARDWARE_ROUTE,
                    );
                  } else {
                    history.push(CONNECT_HARDWARE_ROUTE);
                  }
                }}
              >
                {t('addHardwareWalletLabel')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
              addSnapAccountEnabled ? (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Snaps}
                    startIconProps={{ size: IconSize.Md }}
                    onClick={() => {
                      onClose();
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.AccountAddSelected,
                        properties: {
                          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          account_type: MetaMetricsEventAccountType.Snap,
                          location: 'Main Menu',
                          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          hd_entropy_index: hdEntropyIndex,
                        },
                      });
                      global.platform.openTab({
                        url: process.env.ACCOUNT_SNAPS_DIRECTORY_URL as string,
                      });
                    }}
                  >
                    {t('settingAddSnapAccount')}
                  </ButtonLink>
                </Box>
              ) : null
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              isAddWatchEthereumAccountEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={!isAddWatchEthereumAccountEnabled}
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Eye}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={handleAddWatchAccount}
                    data-testid="multichain-account-menu-popover-add-watch-only-account"
                  >
                    {t('addEthereumWatchOnlyAccount')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            {manageInstitutionalWallets && (
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Add}
                  onClick={() => {
                    onClose();
                    history.push(
                      `/snaps/view/${encodeURIComponent(
                        INSTITUTIONAL_WALLET_SNAP_ID,
                      )}`,
                    );
                  }}
                >
                  {t('manageInstitutionalWallets')}
                </ButtonLink>
              </Box>
            )}
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.LIST ? (
          <>
            {/* Menu content */}
            {children}
            {/* Add / Import / Hardware button */}
            {showAccountCreation ? (
              <Box
                paddingTop={2}
                paddingBottom={4}
                paddingLeft={4}
                paddingRight={4}
                alignItems={AlignItems.center}
                display={Display.Flex}
              >
                <ButtonSecondary
                  startIconName={
                    isMultichainAccountsState1Enabled ? undefined : IconName.Add
                  }
                  size={ButtonSecondarySize.Lg}
                  block
                  onClick={() => setActionMode(ACTION_MODES.MENU)}
                  data-testid="multichain-account-menu-popover-action-button"
                >
                  {isMultichainAccountsState1Enabled
                    ? t('addAccountOrWallet')
                    : t('addImportAccount')}
                </ButtonSecondary>
              </Box>
            ) : null}
          </>
        ) : null}
      </ModalContent>
    </Modal>
  );
};
