import EventEmitter from 'events';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { CUSTODIAN_TYPES } from '@metamask-institutional/custody-keyring';
import {
  updateCustodianTransactions,
  custodianEventHandlerFactory,
} from '@metamask-institutional/extension';
import {
  REFRESH_TOKEN_CHANGE_EVENT,
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
} from '@metamask-institutional/sdk';
import { handleMmiPortfolio } from '@metamask-institutional/portfolio-dashboard';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { CONNECT_HARDWARE_ROUTE } from '../../../ui/helpers/constants/routes';
import { getPermissionBackgroundApiMethods } from './permissions';

export default class MMIController extends EventEmitter {
  constructor(opts) {
    super();

    this.opts = opts;
    this.mmiConfigurationController = opts.mmiConfigurationController;
    this.keyringController = opts.keyringController;
    this.securityProviderRequest = opts.securityProviderRequest;
    this.preferencesController = opts.preferencesController;
    this.appStateController = opts.appStateController;
    this.transactionUpdateController = opts.transactionUpdateController;
    this.custodyController = opts.custodyController;
    this.institutionalFeaturesController = opts.institutionalFeaturesController;
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
      async ({ signature, messageId }) => {
        await this.handleSigningEvents(signature, messageId, 'personal');
      },
    );

    this.signatureController.hub.on(
      'eth_signTypedData:signed',
      async ({ signature, messageId }) => {
        await this.handleSigningEvents(signature, messageId, 'v4');
      },
    );
  } // End of constructor

  async persistKeyringsAfterRefreshTokenChange() {
    this.keyringController.persistAllKeyrings();
  }

  async trackTransactionEventFromCustodianEvent(txMeta, event) {
    // transactionMetricsRequest parameter is already bound in the constructor
    this.trackTransactionEvents(
      {
        transactionMeta: txMeta,
      },
      event,
    );
  }

  async addKeyringIfNotExists(type) {
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
      trackTransactionEvent:
        this.trackTransactionEventFromCustodianEvent.bind(this),
    });
  }

  async storeCustodianSupportedChains(address) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(custodyType);

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
    let addresses = [];
    const custodyTypes = this.custodyController.getAllCustodyTypes();
    for (const type of custodyTypes) {
      try {
        const keyring = await this.addKeyringIfNotExists(type);

        keyring.on(REFRESH_TOKEN_CHANGE_EVENT, () => {
          log.info(`Refresh token change event for ${type}`);
          this.persistKeyringsAfterRefreshTokenChange();
        });

        // Trigger this event, listen to sdk, sdk change the state and then Ui is listening for the state changed
        keyring.on(INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, (payload) => {
          log.info(`Interactive refresh token change event for ${payload}`);
          this.appStateController.showInteractiveReplacementTokenBanner(
            payload,
          );
        });

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
          });
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
    }

    try {
      await this.transactionUpdateController.subscribeToEvents();
    } catch (error) {
      log.error('Error while unlocking extension.', error);
    }

    const mmiConfigData =
      await this.mmiConfigurationController.store.getState();

    if (
      mmiConfigData &&
      mmiConfigData.mmiConfiguration.features?.websocketApi
    ) {
      this.transactionUpdateController.getCustomerProofForAddresses(addresses);
    }
  }

  async connectCustodyAddresses(custodianType, custodianName, accounts) {
    if (!custodianType) {
      throw new Error('No custodian');
    }

    const custodian = CUSTODIAN_TYPES[custodianType.toUpperCase()];
    if (!custodian) {
      throw new Error('No such custodian');
    }

    const newAccounts = Object.keys(accounts);

    // Check if any address is already added
    const identities = Object.keys(
      this.preferencesController.store.getState().identities,
    );
    if (newAccounts.some((address) => identities.indexOf(address) !== -1)) {
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
    keyring.on(INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, (payload) => {
      log.info(`Interactive refresh token change event for ${payload}`);
      this.appStateController.showInteractiveReplacementTokenBanner(payload);
    });

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
        apiUrl: accounts[item].apiUrl,
        custodyType: custodian.keyringClass.type,
        chainId: accounts[item].chainId,
      })),
    );
    this.custodyController.setAccountDetails(
      newAccounts.map((item) => ({
        address: toChecksumHexAddress(item),
        name: accounts[item].name,
        custodianDetails: accounts[item].custodianDetails,
        labels: accounts[item].labels,
        apiUrl: accounts[item].apiUrl,
        custodyType: custodian.keyringClass.type,
        custodianName,
        chainId: accounts[item].chainId,
      })),
    );

    for (let i = 0; i < newAccounts.length; i++) {
      await this.keyringController.addNewAccountForKeyring(keyring);
    }

    const allAccounts = await this.keyringController.getAccounts();

    this.preferencesController.setAddresses(allAccounts);
    const accountsToTrack = [
      ...new Set(oldAccounts.concat(allAccounts.map((a) => a.toLowerCase()))),
    ];

    // Create a Set of lowercased addresses from oldAccounts for efficient existence checks
    const oldAccountsSet = new Set(
      oldAccounts.map((address) => address.toLowerCase()),
    );

    // Create a map of lowercased addresses to names from newAccounts for efficient lookups
    const accountNameMap = newAccounts.reduce((acc, item) => {
      // For each account in newAccounts, add an entry to the map with the lowercased address as the key and the name as the value
      acc[item.toLowerCase()] = accounts[item].name;
      return acc;
    }, {});

    // Iterate over all accounts
    allAccounts.forEach((address) => {
      // Convert the address to lowercase for consistent comparisons
      const lowercasedAddress = address.toLowerCase();

      // If the address is not in oldAccounts
      if (!oldAccountsSet.has(lowercasedAddress)) {
        // Look up the label in the map
        const label = accountNameMap[lowercasedAddress];

        // If the label is defined
        if (label) {
          // Set the label for the address
          this.preferencesController.setAccountLabel(address, label);
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

    if (
      mmiConfigData &&
      mmiConfigData.mmiConfiguration.features?.websocketApi
    ) {
      this.transactionUpdateController.getCustomerProofForAddresses(
        newAccounts,
      );
    }

    return newAccounts;
  }

  async getCustodianAccounts(
    token,
    apiUrl,
    custodianType,
    getNonImportedAccounts,
  ) {
    let currentCustodyType;
    if (!custodianType) {
      const address = this.preferencesController.getSelectedAddress();
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
      keyring = await this.addKeyringIfNotExists(currentCustodyType);
    } else {
      throw new Error('No custodian specified');
    }

    const accounts = await keyring.getCustodianAccounts(
      token,
      apiUrl,
      null,
      getNonImportedAccounts,
    );
    return accounts;
  }

  async getCustodianAccountsByAddress(token, apiUrl, address, custodianType) {
    let keyring;

    if (custodianType) {
      const custodian = CUSTODIAN_TYPES[custodianType.toUpperCase()];
      if (!custodian) {
        throw new Error('No such custodian');
      }

      keyring = await this.addKeyringIfNotExists(custodian.keyringClass.type);
    } else {
      throw new Error('No custodian specified');
    }

    const accounts = await keyring.getCustodianAccounts(token, apiUrl, address);
    return accounts;
  }

  async getCustodianTransactionDeepLink(address, txId) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(custodyType);
    return keyring.getTransactionDeepLink(address, txId);
  }

  async getCustodianConfirmDeepLink(txId) {
    const txMeta = this.txStateManager
      .getTransactions()
      .find((tx) => tx.id === txId);

    const address = txMeta.txParams.from;
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );
    const keyring = await this.addKeyringIfNotExists(custodyType);
    return {
      deepLink: await keyring.getTransactionDeepLink(
        txMeta.txParams.from,
        txMeta.custodyId,
      ),
      custodyId: txMeta.custodyId,
    };
  }

  async getCustodianSignMessageDeepLink(from, custodyTxId) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(from),
    );
    const keyring = await this.addKeyringIfNotExists(custodyType);
    return keyring.getTransactionDeepLink(from, custodyTxId);
  }

  async getCustodianToken(address) {
    const keyring = await this.keyringController.getKeyringForAccount(address);
    const { authDetails } = keyring.getAccountDetails(address);
    return keyring ? authDetails.jwt || authDetails.refreshToken : '';
  }

  // Based on a custodian name, get all the tokens associated with that custodian
  async getCustodianJWTList(custodianEnvName) {
    console.log('getCustodianJWTList', custodianEnvName);

    const { identities } = this.preferencesController.store.getState();

    const { mmiConfiguration } =
      this.mmiConfigurationController.store.getState();

    const addresses = Object.keys(identities);
    const tokenList = [];

    const { custodians } = mmiConfiguration;

    const custodian = custodians.find(
      (item) => item.envName === custodianEnvName,
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

        const custodyAccountDetails =
          this.custodyController.getAccountDetails(address);

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

  async getAllCustodianAccountsWithToken(custodyType, token) {
    const keyring = await this.keyringController.getKeyringsByType(
      `Custody - ${custodyType}`,
    )[0];
    return keyring ? keyring.getAllAccountsWithToken(token) : [];
  }

  async setCustodianNewRefreshToken({ address, newAuthDetails }) {
    const custodyType = this.custodyController.getCustodyTypeByAddress(
      toChecksumHexAddress(address),
    );

    const keyring = await this.addKeyringIfNotExists(custodyType);

    await keyring.replaceRefreshTokenAuthDetails(address, newAuthDetails);
  }

  async handleMmiCheckIfTokenIsPresent(req) {
    const { token, apiUrl } = req.params;
    const custodyType = 'Custody - JSONRPC'; // Only JSONRPC is supported for now

    // This can only work if the extension is unlocked
    await this.appStateController.getUnlockPromise(true);

    const keyring = await this.addKeyringIfNotExists(custodyType);

    return await this.custodyController.handleMmiCheckIfTokenIsPresent({
      token,
      apiUrl,
      keyring,
    });
  }

  async handleMmiDashboardData() {
    await this.appStateController.getUnlockPromise(true);
    const keyringAccounts = await this.keyringController.getAccounts();
    const { identities } = this.preferencesController.store.getState();
    const { metaMetricsId } = this.metaMetricsController.store.getState();
    const getAccountDetails = (address) =>
      this.custodyController.getAccountDetails(address);
    const extensionId = this.extension.runtime.id;

    const { networkConfigurations: networkConfigurationsById } =
      this.networkController.state;
    const networkConfigurations = Object.values(networkConfigurationsById);

    const networks = [
      ...networkConfigurations,
      { chainId: CHAIN_IDS.MAINNET },
      { chainId: CHAIN_IDS.GOERLI },
    ];

    return handleMmiPortfolio({
      keyringAccounts,
      identities,
      metaMetricsId,
      networks,
      getAccountDetails,
      extensionId,
    });
  }

  async newUnsignedMessage(msgParams, req, version) {
    // The code path triggered by deferSetAsSigned: true is for custodial accounts
    const accountDetails = this.custodyController.getAccountDetails(
      msgParams.from,
    );
    const isCustodial = Boolean(accountDetails);
    const updatedMsgParams = { ...msgParams, deferSetAsSigned: isCustodial };

    if (req.method.includes('eth_signTypedData')) {
      return await this.signatureController.newUnsignedTypedMessage(
        updatedMsgParams,
        req,
        version,
      );
    } else if (req.method.includes('personal_sign')) {
      return await this.signatureController.newUnsignedPersonalMessage(
        updatedMsgParams,
        req,
      );
    }
    return await this.signatureController.newUnsignedMessage(
      updatedMsgParams,
      req,
    );
  }

  async handleSigningEvents(signature, messageId, signOperation) {
    if (signature.custodian_transactionId) {
      this.transactionUpdateController.addTransactionToWatchList(
        signature.custodian_transactionId,
        signature.from,
        signOperation,
        true,
      );
    }

    this.signatureController.setMessageMetadata(messageId, signature);

    return this.getState();
  }

  async setAccountAndNetwork(origin, address, chainId) {
    await this.appStateController.getUnlockPromise(true);
    const addressToLowerCase = address.toLowerCase();
    const selectedAddress = this.preferencesController.getSelectedAddress();
    if (selectedAddress.toLowerCase() !== addressToLowerCase) {
      this.preferencesController.setSelectedAddress(addressToLowerCase);
    }
    const selectedChainId = parseInt(
      this.networkController.state.providerConfig.chainId,
      16,
    );
    if (selectedChainId !== chainId && chainId === 1) {
      await this.networkController.setProviderType('mainnet');
    } else if (selectedChainId !== chainId) {
      const foundNetworkConfiguration = Object.values(
        this.networkController.state.networkConfigurations,
      ).find((networkConfiguration) => {
        return parseInt(networkConfiguration.chainId, 16) === chainId;
      });

      if (foundNetworkConfiguration !== undefined) {
        await this.networkConfiguration.setActiveNetwork(
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
