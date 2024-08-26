import EventEmitter from 'events';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import {
  CUSTODIAN_TYPES,
  CustodyKeyring,
  MmiConfigurationController,
} from '@metamask-institutional/custody-keyring';
import {
  updateCustodianTransactions,
  custodianEventHandlerFactory,
} from '@metamask-institutional/extension';
import {
  REFRESH_TOKEN_CHANGE_EVENT,
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
} from '@metamask-institutional/sdk';
import { handleMmiPortfolio } from '@metamask-institutional/portfolio-dashboard';
import { TransactionMeta } from '@metamask/transaction-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { SignatureController } from '@metamask/signature-controller';
import {
  OriginalRequest,
  PersonalMessageParams,
} from '@metamask/message-manager';
import { NetworkController } from '@metamask/network-controller';
import { InternalAccount } from '@metamask/keyring-api';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { CONNECT_HARDWARE_ROUTE } from '../../../ui/helpers/constants/routes';
import {
  MMIControllerOptions,
  ISignedEvent,
  IInteractiveRefreshTokenChangeEvent,
  Label,
  Signature,
  ConnectionRequest,
} from '../../../shared/constants/mmi-controller';
import AccountTracker from '../lib/account-tracker';
import { getCurrentChainId } from '../../../ui/selectors';
import MetaMetricsController from './metametrics';
import { getPermissionBackgroundApiMethods } from './permissions';
import { PreferencesController } from './preferences';
import { AppStateController } from './app-state';

type UpdateCustodianTransactionsParameters = {
  keyring: CustodyKeyring;
  type: string;
  txList: string[];
  custodyController: CustodyController;
  transactionUpdateController: TransactionUpdateController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txStateManager: any;
  getPendingNonce: (address: string) => Promise<number>;
  setTxHash: (txId: string, txHash: string) => void;
};

export default class MMIController extends EventEmitter {
  public opts: MMIControllerOptions;

  public mmiConfigurationController: MmiConfigurationController;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public keyringController: any;

  public preferencesController: PreferencesController;

  public appStateController: AppStateController;

  public transactionUpdateController: TransactionUpdateController;

  private custodyController: CustodyController;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getState: () => any;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getPendingNonce: (address: string) => Promise<any>;

  private accountTracker: AccountTracker;

  private metaMetricsController: MetaMetricsController;

  private networkController: NetworkController;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private permissionController: any;

  private signatureController: SignatureController;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private messenger: any;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private platform: any;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extension: any;

  private updateTransactionHash: (txId: string, txHash: string) => void;

  private setChannelId: (channelId: string) => void;

  private setConnectionRequest: (payload: ConnectionRequest | null) => void;

  public trackTransactionEvents: (
    args: { transactionMeta: TransactionMeta },
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) => void;

  private txStateManager: {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTransactions: (query?: any, opts?: any, fullTx?: boolean) => any[];
    setTxStatusSigned: (txId: string) => void;
    setTxStatusSubmitted: (txId: string) => void;
    setTxStatusFailed: (txId: string) => void;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTransaction: (txMeta: any) => void;
  };

  constructor(opts: MMIControllerOptions) {
    super();

    this.opts = opts;
    this.messenger = opts.messenger;
    this.mmiConfigurationController = opts.mmiConfigurationController;
    this.keyringController = opts.keyringController;
    this.preferencesController = opts.preferencesController;
    this.appStateController = opts.appStateController;
    this.transactionUpdateController = opts.transactionUpdateController;
    this.custodyController = opts.custodyController;
    this.getState = opts.getState;
    this.getPendingNonce = opts.getPendingNonce;
    this.accountTracker = opts.accountTracker;
    this.metaMetricsController = opts.metaMetricsController;
    this.networkController = opts.networkController;
    this.permissionController = opts.permissionController;
    this.signatureController = opts.signatureController;
    this.platform = opts.platform;
    this.extension = opts.extension;

    this.updateTransactionHash = opts.updateTransactionHash;
    this.setChannelId = opts.setChannelId;
    this.setConnectionRequest = opts.setConnectionRequest;

    this.trackTransactionEvents = opts.trackTransactionEvents;
    this.txStateManager = {
      getTransactions: opts.getTransactions,
      setTxStatusSigned: opts.setTxStatusSigned,
      setTxStatusSubmitted: opts.setTxStatusSubmitted,
      setTxStatusFailed: opts.setTxStatusFailed,
      updateTransaction: opts.updateTransaction,
    };

    // Prepare event listener after transactionUpdateController gets initiated
    this.transactionUpdateController.prepareEventListener(
      this.custodianEventHandlerFactory.bind(this),
    );

    // Get configuration from MMIConfig controller
    if (!process.env.IN_TEST) {
      this.mmiConfigurationController.storeConfiguration().then(() => {
        // This must happen after the configuration is fetched
        // Otherwise websockets will always be disabled in the first run

        this.transactionUpdateController.subscribeToEvents();
      });
    }

    this.signatureController.hub.on(
      'personal_sign:signed',
      async ({ signature, messageId }: ISignedEvent) => {
        await this.handleSigningEvents(signature, messageId, 'personal');
      },
    );

    this.signatureController.hub.on(
      'eth_signTypedData:signed',
      async ({ signature, messageId }: ISignedEvent) => {
        await this.handleSigningEvents(signature, messageId, 'v4');
      },
    );

    this.transactionUpdateController.on(
      'handshake',
      async ({ channelId }: { channelId: string }) => {
        this.setChannelId(channelId);
      },
    );

    this.transactionUpdateController.on(
      'connection.request',
      async (payload: ConnectionRequest) => {
        this.setConnectionRequest(payload);
      },
    );
  } // End of constructor

  async persistKeyringsAfterRefreshTokenChange() {
    this.keyringController.persistAllKeyrings();
  }

  async trackTransactionEventFromCustodianEvent(
    txMeta: TransactionMeta,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) {
    // transactionMetricsRequest parameter is already bound in the constructor
    this.trackTransactionEvents(
      {
        transactionMeta: txMeta,
      },
      event,
    );
  }

  async addKeyringIfNotExists(type: KeyringTypes) {
    let keyring = await this.keyringController.getKeyringsByType(type)[0];
    if (!keyring) {
      keyring = await this.keyringController.addNewKeyring(type);
    }
    return keyring;
  }

  custodianEventHandlerFactory() {
    return custodianEventHandlerFactory({
      log,
      getState: () => this.getState(),
      getPendingNonce: (address) => this.getPendingNonce(address),
      setTxHash: (txId, txHash) => this.updateTransactionHash(txId, txHash),
      signatureController: this.signatureController,
      txStateManager: this.txStateManager,
      custodyController: this.custodyController,
      // @ts-expect-error not relevant
      trackTransactionEvent:
        this.trackTransactionEventFromCustodianEvent.bind(this),
      captureException,
    });
  }

  async storeCustodianSupportedChains(address: string) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(
      custodyType as KeyringTypes,
    );

    const supportedChains = await keyring.getSupportedChains(address);

    if (supportedChains?.status === 401) {
      return;
    }

    const accountDetails = this.custodyController.getAccountDetails(address);

    await this.custodyController.storeSupportedChainsForAddress(
      toChecksumHexAddress(address),
      supportedChains,
      accountDetails.custodianName,
    );
  }

  async onSubmitPassword() {
    // Create a keyring for each custodian type
    let addresses: string[] = [];
    const custodyTypes = this.custodyController.getAllCustodyTypes();

    for (const type of custodyTypes) {
      try {
        const keyring = await this.addKeyringIfNotExists(type as KeyringTypes);

        keyring.on(REFRESH_TOKEN_CHANGE_EVENT, () => {
          log.info(`Refresh token change event for ${type}`);
          this.persistKeyringsAfterRefreshTokenChange();
        });

        // Trigger this event, listen to sdk, sdk change the state and then Ui is listening for the state changed
        keyring.on(
          INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
          (payload: IInteractiveRefreshTokenChangeEvent) => {
            log.info(`Interactive refresh token change event for ${payload}`);
            this.appStateController.showInteractiveReplacementTokenBanner(
              payload,
            );
          },
        );

        // store the supported chains for this custodian type
        const accounts = await keyring.getAccounts();
        addresses = addresses.concat(...accounts);
        for (const address of accounts) {
          try {
            await this.storeCustodianSupportedChains(address);
          } catch (error) {
            captureException(error);
            log.error('Error while unlocking extension.', error);
          }
        }

        const txList = this.txStateManager.getTransactions({}, [], false); // Includes all transactions, but we are looping through keyrings. Currently filtering is done in updateCustodianTransactions :-/

        try {
          updateCustodianTransactions({
            keyring,
            type,
            txList,
            getPendingNonce: (address) => this.getPendingNonce(address),
            setTxHash: (txId, txHash) =>
              this.updateTransactionHash(txId, txHash),
            txStateManager: this.txStateManager,
            custodyController: this.custodyController,
            transactionUpdateController: this.transactionUpdateController,
          } as UpdateCustodianTransactionsParameters);
        } catch (error) {
          log.error('Error doing offline transaction updates', error);
          captureException(error);
        }
      } catch (error) {
        log.error(
          `Error while unlocking extension with custody type ${type}`,
          error,
        );
        captureException(error);
      }
    }

    try {
      await this.mmiConfigurationController.storeConfiguration();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
      captureException(error);
    }

    try {
      await this.transactionUpdateController.subscribeToEvents();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
      captureException(error);
    }

    const mmiConfigData =
      await this.mmiConfigurationController.store.getState();

    if (mmiConfigData?.mmiConfiguration?.features?.websocketApi) {
      this.transactionUpdateController.getCustomerProofForAddresses(addresses);
    }
  }

  async connectCustodyAddresses(
    custodianType: string,
    custodianName: string,
    accounts: Record<
      string,
      {
        name: string;
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        custodianDetails: any;
        labels: Label[];
        token: string;
        chainId: number;
      }
    >,
  ) {
    if (!custodianType) {
      throw new Error('No custodian');
    }

    const custodian = CUSTODIAN_TYPES[custodianType.toUpperCase()];
    if (!custodian) {
      throw new Error('No such custodian');
    }

    const newAccounts = Object.keys(accounts);

    // Check if any address is already added
    if (
      newAccounts.some((address) =>
        this.messenger.call('AccountsController:getAccountByAddress', address),
      )
    ) {
      throw new Error('Cannot import duplicate accounts');
    }

    const keyring = await this.addKeyringIfNotExists(
      custodian.keyringClass.type,
    );

    keyring.on(REFRESH_TOKEN_CHANGE_EVENT, () => {
      log.info(`Refresh token change event for ${keyring.type}`);
      this.persistKeyringsAfterRefreshTokenChange();
    });

    // Trigger this event, listen to sdk, sdk change the state and then Ui is listening for the state changed
    keyring.on(
      INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
      (payload: IInteractiveRefreshTokenChangeEvent) => {
        log.info(`Interactive refresh token change event for ${payload}`);
        this.appStateController.showInteractiveReplacementTokenBanner(payload);
      },
    );

    if (!keyring) {
      throw new Error('Unable to get keyring');
    }
    const oldAccounts = await this.keyringController.getAccounts();

    await keyring.setSelectedAddresses(
      newAccounts.map((item) => ({
        address: toChecksumHexAddress(item),
        name: accounts[item].name,
        custodianDetails: accounts[item].custodianDetails,
        labels: accounts[item].labels,
        token: accounts[item].token,
        envName: custodianName,
        custodyType: custodian.keyringClass.type,
        chainId: accounts[item].chainId,
      })),
    );

    this.custodyController.setAccountDetails(
      newAccounts.map((item) => ({
        address: toChecksumHexAddress(item),
        name: accounts[item].name,
        custodianDetails: accounts[item].custodianDetails,
        labels: accounts[item].labels as unknown as string[],
        custodyType: custodian.keyringClass.type,
        custodianName,
        chainId: accounts[item].chainId,
      })),
    );

    // the underscore indicates that the variable is a placeholder and intentionally not used
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of newAccounts) {
      await this.keyringController.addNewAccountForKeyring(keyring);
    }

    const allAccounts = await this.keyringController.getAccounts();

    const accountsToTrack = [
      ...new Set(
        oldAccounts.concat(allAccounts.map((a: string) => a.toLowerCase())),
      ),
    ];

    // Create a Set of lowercased addresses from oldAccounts for efficient existence checks
    const oldAccountsSet = new Set(
      oldAccounts.map((address: string) => address.toLowerCase()),
    );

    // Create a map of lowercased addresses to names from newAccounts for efficient lookups
    const accountNameMap = newAccounts.reduce<Record<string, string>>(
      (acc, item) => {
        // For each account in newAccounts, add an entry to the map with the lowercased address as the key and the name as the value
        acc[item.toLowerCase()] = accounts[item].name;
        return acc;
      },
      {},
    );

    // Iterate over all accounts
    allAccounts.forEach((address: string) => {
      // Convert the address to lowercase for consistent comparisons
      const lowercasedAddress = address.toLowerCase();

      // If the address is not in oldAccounts
      if (!oldAccountsSet.has(lowercasedAddress)) {
        // Look up the label in the map
        const label = accountNameMap[lowercasedAddress];

        // If the label is defined
        if (label) {
          // Set the label for the address
          const account = this.messenger.call(
            'AccountsController:getAccountByAddress',
            address,
          );
          this.messenger.call(
            'AccountsController:setAccountName',
            account.id,
            label,
          );
        }
      }
    });

    this.accountTracker.syncWithAddresses(accountsToTrack);

    for (const address of newAccounts) {
      try {
        await this.storeCustodianSupportedChains(address);
      } catch (error) {
        captureException(error);
      }
    }

    // FIXME: status maps are not a thing anymore
    this.custodyController.storeCustodyStatusMap(
      custodian.envName,
      keyring.getStatusMap(),
    );

    // MMI - get a WS stream for this account
    const mmiConfigData =
      await this.mmiConfigurationController.store.getState();

    if (mmiConfigData?.mmiConfiguration?.features?.websocketApi) {
      this.transactionUpdateController.getCustomerProofForAddresses(
        newAccounts,
      );
    }

    return newAccounts;
  }

  async getCustodianAccounts(
    token: string,
    envName: string,
    custodianType: string,
    getNonImportedAccounts: boolean,
  ) {
    let currentCustodyType: string = '';
    if (!custodianType) {
      const { address } = this.messenger.call(
        'AccountsController:getSelectedAccount',
      );
      currentCustodyType = this.custodyController.getCustodyTypeByAddress(
        toChecksumHexAddress(address),
      );
    }

    let keyring;

    if (custodianType) {
      const custodian = CUSTODIAN_TYPES[custodianType.toUpperCase()];
      if (!custodian) {
        throw new Error('No such custodian');
      }

      keyring = await this.addKeyringIfNotExists(custodian.keyringClass.type);
    } else if (currentCustodyType) {
      keyring = await this.addKeyringIfNotExists(
        currentCustodyType as KeyringTypes,
      );
    } else {
      throw new Error('No custodian specified');
    }

    const accounts = await keyring.getCustodianAccounts(
      token,
      envName,
      null,
      getNonImportedAccounts,
    );
    return accounts;
  }

  async getCustodianTransactionDeepLink(address: string, txId: string) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(
      custodyType as KeyringTypes,
    );
    return keyring.getTransactionDeepLink(address, txId);
  }

  async getCustodianConfirmDeepLink(txId: string) {
    const txMeta = this.txStateManager
      .getTransactions()
      .find((tx) => tx.id === txId);

    const address = txMeta.txParams.from;
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(
      custodyType as KeyringTypes,
    );
    return {
      deepLink: await keyring.getTransactionDeepLink(
        txMeta.txParams.from,
        txMeta.custodyId,
      ),
      custodyId: txMeta.custodyId,
    };
  }

  async getCustodianSignMessageDeepLink(from: string, custodyTxId: string) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(from),
    );
    const keyring = await this.addKeyringIfNotExists(
      custodyType as KeyringTypes,
    );
    return keyring.getTransactionDeepLink(from, custodyTxId);
  }

  async getCustodianToken(address: string) {
    const keyring = await this.keyringController.getKeyringForAccount(address);
    const { authDetails } = keyring.getAccountDetails(address);
    return keyring
      ? (authDetails && (authDetails.jwt || authDetails.refreshToken)) || ''
      : '';
  }

  // Based on a custodian name, get all the tokens associated with that custodian
  async getCustodianJWTList(custodianEnvName: string) {
    const internalAccounts = this.messenger.call(
      'AccountsController:listAccounts',
    );

    const { mmiConfiguration } =
      this.mmiConfigurationController.store.getState();

    const addresses = internalAccounts.map(
      (internalAccount: InternalAccount) => internalAccount.address,
    );
    const tokenList: string[] = [];

    const { custodians } = mmiConfiguration;

    const custodian = custodians.find(
      (item: { envName: string }) => item.envName === custodianEnvName,
    );

    if (!custodian) {
      return [];
    }

    const keyrings = await this.keyringController.getKeyringsByType(
      `Custody - ${custodian.type}`,
    );

    for (const address of addresses) {
      for (const keyring of keyrings) {
        // Narrow down to custodian Type
        const accountDetails = keyring.getAccountDetails(address);

        if (!accountDetails) {
          log.debug(`${address} does not belong to ${custodian.type} keyring`);
          continue;
        }

        const custodyAccountDetails = this.custodyController.getAccountDetails(
          toChecksumHexAddress(address),
        );

        if (
          !custodyAccountDetails ||
          custodyAccountDetails.custodianName !== custodianEnvName
        ) {
          log.debug(
            `${address} does not belong to ${custodianEnvName} keyring`,
          );
          continue;
        }

        const { authDetails } = accountDetails;

        let token;
        if (authDetails.jwt) {
          token = authDetails.jwt;
        } else if (authDetails.refreshToken) {
          token = authDetails.refreshToken;
        }

        if (!tokenList.includes(token)) {
          tokenList.push(token);
        }
      }
    }
    return tokenList;
  }

  async getAllCustodianAccountsWithToken(custodyType: string, token: string) {
    const keyring = await this.keyringController.getKeyringsByType(
      `Custody - ${custodyType}`,
    )[0];
    return keyring ? keyring.getAllAccountsWithToken(token) : [];
  }

  async setCustodianNewRefreshToken({
    address,
    refreshToken,
  }: {
    address: string;
    refreshToken: string;
  }) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );

    const keyring = await this.addKeyringIfNotExists(
      custodyType as KeyringTypes,
    );

    await keyring.replaceRefreshTokenAuthDetails(address, refreshToken);
  }

  async handleMmiCheckIfTokenIsPresent(req: {
    params: { token: string; envName: string; address: string };
  }) {
    const { token, envName, address } = req.params;

    const currentAddress =
      address ||
      this.messenger.call('AccountsController:getSelectedAccount').address;
    const currentCustodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(currentAddress),
    );

    // This can only work if the extension is unlocked
    await this.appStateController.getUnlockPromise(true);

    const keyring = await this.addKeyringIfNotExists(
      currentCustodyType as KeyringTypes,
    );

    return await this.custodyController.handleMmiCheckIfTokenIsPresent({
      token,
      envName,
      keyring,
    });
  }

  async handleMmiDashboardData() {
    await this.appStateController.getUnlockPromise(true);
    const keyringAccounts = await this.keyringController.getAccounts();

    // TEMP: Convert internal accounts to match identities format
    // TODO: Convert handleMmiPortfolio to use internal accounts
    const internalAccounts = this.messenger
      .call('AccountsController:listAccounts')
      .map((internalAccount: InternalAccount) => {
        return {
          address: internalAccount.address,
          name: internalAccount.metadata.name,
        };
      });
    const { metaMetricsId } = this.metaMetricsController.store.getState();
    const getAccountDetails = (address: string) =>
      this.custodyController.getAccountDetails(address);
    const extensionId = this.extension.runtime.id;

    const { networkConfigurations: networkConfigurationsById } =
      this.networkController.state;
    const networkConfigurations = Object.values(networkConfigurationsById);

    const networks = [
      ...networkConfigurations,
      { chainId: CHAIN_IDS.MAINNET },
      { chainId: CHAIN_IDS.SEPOLIA },
    ];

    return handleMmiPortfolio({
      keyringAccounts,
      identities: internalAccounts,
      metaMetricsId,
      networks,
      getAccountDetails,
      extensionId,
    });
  }

  async newUnsignedMessage(
    msgParams: { from: string },
    req: { method: string | string[] },
    version: string,
  ) {
    // The code path triggered by deferSetAsSigned: true is for custodial accounts
    const accountDetails = this.custodyController.getAccountDetails(
      msgParams.from,
    );
    const isCustodial = Boolean(accountDetails);
    const updatedMsgParams = { ...msgParams, deferSetAsSigned: isCustodial };

    if (
      req.method === 'eth_signTypedData' ||
      req.method === 'eth_signTypedData_v3' ||
      req.method === 'eth_signTypedData_v4'
    ) {
      return await this.signatureController.newUnsignedTypedMessage(
        updatedMsgParams as PersonalMessageParams,
        req as OriginalRequest,
        version,
        { parseJsonData: false },
      );
    } else if (req.method === 'personal_sign') {
      return await this.signatureController.newUnsignedPersonalMessage(
        updatedMsgParams as PersonalMessageParams,
        req as OriginalRequest,
      );
    }

    throw new Error('Unexpected method');
  }

  async handleSigningEvents(
    signature: Signature,
    messageId: string,
    signOperation: string,
  ) {
    if (signature.custodian_transactionId) {
      this.transactionUpdateController.addTransactionToWatchList(
        signature.custodian_transactionId,
        signature.from,
        signOperation,
        true,
      );

      this.appStateController.setCustodianDeepLink({
        fromAddress: signature.from,
        custodyId: signature.custodian_transactionId,
      });
    }

    this.signatureController.setMessageMetadata(messageId, signature);

    return this.getState();
  }

  async setAccountAndNetwork(origin: string, address: string, chainId: number) {
    await this.appStateController.getUnlockPromise(true);
    const addressToLowerCase = address.toLowerCase();
    const { address: selectedAddress } = this.messenger.call(
      'AccountsController:getSelectedAccount',
    );

    if (selectedAddress.toLowerCase() !== addressToLowerCase) {
      const internalAccount = this.messenger.call(
        'AccountsController:getAccountByAddress',
        addressToLowerCase,
      );
      this.messenger.call(
        'AccountsController:setSelectedAccount',
        internalAccount.id,
      );
    }
    const selectedChainId = parseInt(
      getCurrentChainId({ metamask: this.networkController.state }),
      16,
    );
    if (selectedChainId !== chainId && chainId === 1) {
      await this.networkController.setActiveNetwork('mainnet');
    } else if (selectedChainId !== chainId) {
      const { networkConfigurations } = this.networkController.state;

      const foundNetworkConfiguration = Object.values(
        networkConfigurations,
      ).find(
        (networkConfiguration) =>
          parseInt(networkConfiguration.chainId, 16) === chainId,
      );

      if (foundNetworkConfiguration !== undefined) {
        await this.networkController.setActiveNetwork(
          foundNetworkConfiguration.id,
        );
      }
    }

    getPermissionBackgroundApiMethods(
      this.permissionController,
    ).addPermittedAccount(origin, addressToLowerCase);

    return true;
  }

  async handleMmiOpenAddHardwareWallet() {
    await this.appStateController.getUnlockPromise(true);
    this.platform.openExtensionInBrowser(CONNECT_HARDWARE_ROUTE);
    return true;
  }
}
