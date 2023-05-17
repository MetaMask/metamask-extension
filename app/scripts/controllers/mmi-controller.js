import EventEmitter from 'events';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import {
  PersonalMessageManager,
  TypedMessageManager,
} from '@metamask/message-manager';
import { CUSTODIAN_TYPES } from '@metamask-institutional/custody-keyring';
import {
  updateCustodianTransactions,
  custodianEventHandlerFactory,
} from '@metamask-institutional/extension';
import {
  REFRESH_TOKEN_CHANGE_EVENT,
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
} from '@metamask-institutional/sdk';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { FINALIZED_TRANSACTION_STATUSES } from '../../../shared/constants/transaction';

export default class MMIController extends EventEmitter {
  constructor(opts) {
    super();

    this.opts = opts;
    this.mmiConfigurationController = opts.mmiConfigurationController;
    this.keyringController = opts.keyringController;
    this.txController = opts.txController;
    this.securityProviderRequest = opts.securityProviderRequest;
    this.preferencesController = opts.preferencesController;
    this.appStateController = opts.appStateController;
    this.transactionUpdateController = opts.transactionUpdateController;
    this.custodyController = opts.custodyController;
    this.institutionalFeaturesController = opts.institutionalFeaturesController;
    this.addKeyringIfNotExists = opts.addKeyringIfNotExists;
    this.getState = opts.getState;
    this.getPendingNonce = opts.getPendingNonce;

    this.personalMessageManager = new PersonalMessageManager(
      undefined,
      undefined,
      this.securityProviderRequest,
    );
    this.typedMessageManager = new TypedMessageManager(
      undefined,
      undefined,
      this.securityProviderRequest,
    );

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
  } // End of constructor

  async persistKeyringsAfterRefreshTokenChange() {
    this.keyringController.persistAllKeyrings();
  }

  async trackTransactionEventFromCustodianEvent(txMeta, event) {
    this.txController._trackTransactionMetricsEvent(txMeta, event);
  }

  custodianEventHandlerFactory() {
    return custodianEventHandlerFactory({
      log,
      FINALIZED_TRANSACTION_STATUSES,
      getState: () => this.getState(),
      addKeyringIfNotExists: (t) => this.addKeyringIfNotExists(t),
      getPendingNonce: (address) => this.getPendingNonce(address),
      setTxHash: (txId, txHash) => this.txController.setTxHash(txId, txHash),
      typedMessageManager: this.typedMessageManager,
      personalMessageManager: this.personalMessageManager,
      txStateManager: this.txController.txStateManager,
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

        const txList = this.txController.txStateManager.getTransactions(
          {},
          [],
          false,
        ); // Includes all transactions, but we are looping through keyrings. Currently filtering is done in updateCustodianTransactions :-/

        try {
          updateCustodianTransactions({
            keyring,
            type,
            txList,
            getPendingNonce: this.getPendingNonce.bind(this),
            txStateManager: this.txController.txStateManager,
            setTxHash: this.txController.setTxHash.bind(this.txController),
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

    try {
      if (this.institutionalFeaturesController.getComplianceProjectId()) {
        this.institutionalFeaturesController.startPolling();
      }
    } catch (e) {
      log.error('Failed to start Compliance polling');
      log.error(e);
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

    newAccounts.forEach(
      async () => await this.keyringController.addNewAccount(keyring),
    );

    const allAccounts = await this.keyringController.getAccounts();

    this.preferencesController.setAddresses(allAccounts);
    const accountsToTrack = [
      ...new Set(oldAccounts.concat(allAccounts.map((a) => a.toLowerCase()))),
    ];

    allAccounts.forEach((address) => {
      if (!oldAccounts.includes(address.toLowerCase())) {
        const label = newAccounts
          .filter((item) => item.toLowerCase() === address)
          .map((item) => accounts[item].name)[0];
        this.preferencesController.setAccountLabel(address, label);
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
      custodian.name,
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
    const txMeta = this.txController.txStateManager.getTransaction(txId);

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

  async getCustodianToken(custodianType) {
    let currentCustodyType;

    const address = this.preferencesController.getSelectedAddress();

    if (!custodianType) {
      const resultCustody = this.custodyController.getCustodyTypeByAddress(
        toChecksumHexAddress(address),
      );
      currentCustodyType = resultCustody;
    }
    let keyring = await this.keyringController.getKeyringsByType(
      currentCustodyType || `Custody - ${custodianType}`,
    )[0];
    if (!keyring) {
      keyring = await this.keyringController.addNewKeyring(
        currentCustodyType || `Custody - ${custodianType}`,
      );
    }
    const { authDetails } = keyring.getAccountDetails(address);
    return keyring ? authDetails.jwt || authDetails.refreshToken : '';
  }

  // Based on a custodian name, get all the tokens associated with that custodian
  async getCustodianJWTList(custodianName) {
    console.log('getCustodianJWTList', custodianName);

    const { identities } = this.preferencesController.store.getState();

    const { mmiConfiguration } =
      this.mmiConfigurationController.store.getState();

    const addresses = Object.keys(identities);
    const tokenList = [];

    const { custodians } = mmiConfiguration;

    const custodian = custodians.find((item) => item.name === custodianName);

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
          custodyAccountDetails.custodianName !== custodianName
        ) {
          log.debug(`${address} does not belong to ${custodianName} keyring`);
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
}
