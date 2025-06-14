import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  KeyringAccountType,
  SolAccountType,
} from '@metamask/keyring-api';

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
  getAllChainsToPoll,
  getConnectedSubjectsForAllAddresses,
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
  getHdKeyringOfSelectedAccountOrPrimaryKeyring,
  getIsAddSnapAccountEnabled,
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsWatchEthereumAccountEnabled,
  getManageInstitutionalWallets,
  getMetaMaskHdKeyrings,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
} from '../../../selectors';
import { detectNfts, setSelectedAccount } from '../../../store/actions';
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
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  MultichainWalletSnapClient,
  useMultichainWalletSnapClient,
  WalletClientType,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';
///: END:ONLY_INCLUDE_IF
import {
  AccountConnections,
  MergedInternalAccount,
} from '../../../selectors/selectors.types';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import { CreateEthAccount } from '../../multichain/create-eth-account';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { CreateSnapAccount } from '../../multichain/create-snap-account';
import { CreateAccountSnapOptions } from '../../../../shared/lib/accounts';
///: END:ONLY_INCLUDE_IF
import { ImportAccount } from '../../multichain/import-account';
import { SrpList } from '../../multichain/multi-srp/srp-list';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/institutional-wallet-snap';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/multichain-accounts-selectors';
import { MultichainAccountsTree } from '../multichain-accounts-tree';
import {
  ActionMode,
  ACTION_MODES,
  getActionTitle,
  SNAP_CLIENT_CONFIG_MAP,
} from './multichain-account-list-menu.utils';

export type MultichainAccountListMenuProps = {
  onClose: () => void;
  privacyMode?: boolean;
  showAccountCreation?: boolean;
  accountListItemProps?: Record<string, unknown>;
  allowedAccountTypes?: KeyringAccountType[];
};

export const MultichainAccountListMenu = ({
  onClose,
  privacyMode = false,
  showAccountCreation = true,
  accountListItemProps,
  allowedAccountTypes = [
    EthAccountType.Eoa,
    EthAccountType.Erc4337,
    BtcAccountType.P2pkh,
    BtcAccountType.P2sh,
    BtcAccountType.P2wpkh,
    BtcAccountType.P2tr,
    SolAccountType.DataAccount,
  ],
}: MultichainAccountListMenuProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  useEffect(() => {
    endTrace({ name: TraceName.AccountList });
  }, []);
  const allChainIds = useSelector(getAllChainsToPoll);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(
    getConnectedSubjectsForAllAddresses,
  ) as AccountConnections;
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const dispatch = useDispatch();

  const [actionMode, setActionMode] = useState<ActionMode>(ACTION_MODES.LIST);
  const [previousActionMode, setPreviousActionMode] = useState<ActionMode>(
    ACTION_MODES.LIST,
  );
  const walletAccountCollection = useSelector(getWalletsWithAccounts);
  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
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
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: ACCOUNT_WATCHER_SNAP_ID,
        snap_name: ACCOUNT_WATCHER_NAME,
        location: 'Main Menu',
        hd_entropy_index: hdEntropyIndex,
      },
    });
    onClose();
    history.push(`/snaps/view/${encodeURIComponent(ACCOUNT_WATCHER_SNAP_ID)}`);
  }, [trackEvent, onClose, history]);
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
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: client.getSnapId(),
        snap_name: client.getSnapName(),
        location: 'Main Menu',
        hd_entropy_index: hdEntropyIndex,
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
    () => getActionTitle(t as (text: string) => string, actionMode),
    [actionMode, t],
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

  const onAccountListItemItemClicked = useCallback(
    (account: MergedInternalAccount) => {
      onClose();
      trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.NavAccountSwitched,
        properties: {
          location: 'Main Menu',
          hd_entropy_index: hdEntropyIndex,
        },
      });
      endTrace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });
      trace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });
      dispatch(setSelectedAccount(account.address));
      dispatch(detectNfts(allChainIds));
    },
    [
      dispatch,
      onClose,
      trackEvent,
      defaultHomeActiveTabName,
      hdEntropyIndex,
      allChainIds,
    ],
  );

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
                      account_type: MetaMetricsEventAccountType.Default,
                      location: 'Main Menu',
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
                      account_type: MetaMetricsEventAccountType.Imported,
                      location: 'Main Menu',
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
                      account_type: MetaMetricsEventAccountType.Hardware,
                      location: 'Main Menu',
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
                          account_type: MetaMetricsEventAccountType.Snap,
                          location: 'Main Menu',
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
            {/* Account list block */}
            <Box className="multichain-account-menu-popover__list">
              <MultichainAccountsTree
                wallets={walletAccountCollection}
                allowedAccountTypes={allowedAccountTypes}
                connectedSites={connectedSites}
                currentTabOrigin={currentTabOrigin}
                privacyMode={privacyMode}
                accountListItemProps={accountListItemProps}
                selectedAccount={selectedAccount}
                onClose={onClose}
                onAccountListItemItemClicked={onAccountListItemItemClicked}
              />
            </Box>
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
                  startIconName={IconName.Add}
                  size={ButtonSecondarySize.Lg}
                  block
                  onClick={() => setActionMode(ACTION_MODES.MENU)}
                  data-testid="multichain-account-menu-popover-action-button"
                >
                  {t('addImportAccount')}
                </ButtonSecondary>
              </Box>
            ) : null}
          </>
        ) : null}
      </ModalContent>
    </Modal>
  );
};
