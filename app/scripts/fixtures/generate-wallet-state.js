import { Messenger } from '@metamask/messenger';
import { KeyringController } from '@metamask/keyring-controller';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { cloneDeep } from 'lodash';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';
import { WALLET_PASSWORD } from '../../../test/e2e/constants';
import { E2E_SRP, defaultFixture } from '../../../test/e2e/default-fixture';
import FixtureBuilder from '../../../test/e2e/fixture-builder';
import { encryptorFactory } from '../lib/encryptor-factory';
import { normalizeSafeAddress } from '../lib/multichain/address';
import { getRootMessenger } from '../lib/messenger';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { withAddressBook } from './with-address-book';
import { FIXTURES_APP_STATE } from './with-app-state';
import { withConfirmedTransactions } from './with-confirmed-transactions';
import { FIXTURES_ERC20_TOKENS } from './with-erc20-tokens';
import { ALL_POPULAR_NETWORKS, FIXTURES_NETWORKS } from './with-networks';
import { FIXTURES_PREFERENCES } from './with-preferences';
import { withUnreadNotifications } from './with-unread-notifications';

let FIXTURES_CONFIG = {};

/**
 * Generates the wallet state based on the fixtures set in the environment variable.
 *
 * @param {object} withState - The fixture configuration state
 * @param {boolean} fromTest - Whether this is being called from a test
 * @returns {Promise<FixtureBuilder>} The generated FixtureBuilder object
 */
export async function generateWalletState(withState, fromTest) {
  const fixtureBuilder = new FixtureBuilder({ inputChainId: '0xaa36a7' });

  if (withState) {
    FIXTURES_CONFIG = withState;
  }

  const { vault, accounts } = await generateVaultAndAccount(
    process.env.TEST_SRP || E2E_SRP,
    fromTest ? WALLET_PASSWORD : process.env.PASSWORD,
  );

  fixtureBuilder
    .withAccountsController(generateAccountsControllerState(accounts))
    .withAddressBookController(generateAddressBookControllerState())
    .withAnnouncementController(generateAnnouncementControllerState())
    .withAppStateController(FIXTURES_APP_STATE)
    .withKeyringController(generateKeyringControllerState(vault))
    .withNetworkController(generateNetworkControllerState())
    .withNotificationServicesController(
      generateNotificationControllerState(accounts[0]),
    )
    .withPreferencesController(generatePreferencesControllerState(accounts))
    .withTokensController(generateTokensControllerState(accounts[0]))
    .withTransactionController(generateTransactionControllerState(accounts[0]))
    .withEnabledNetworks(ALL_POPULAR_NETWORKS)
    .withNftController(generateNftControllerState(accounts));

  return fixtureBuilder;
}

/**
 * Generates a new vault and account based on the provided seed phrase and password.
 *
 * @param {string} encodedSeedPhrase - The encoded seed phrase.
 * @param {string} password - The password for the vault.
 * @returns {Promise<{vault: object, accounts: Array<string>}>} The generated vault and account.
 */
async function generateVaultAndAccount(encodedSeedPhrase, password) {
  const messenger = getRootMessenger();
  const keyringControllerMessenger = new Messenger({
    namespace: 'KeyringController',
    parent: messenger,
  });
  const krCtrl = new KeyringController({
    encryptor: encryptorFactory(600_000),
    messenger: keyringControllerMessenger,
  });

  const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);
  const _convertMnemonicToWordlistIndices = (mnemonic) => {
    const indices = mnemonic
      .toString()
      .split(' ')
      .map((word) => wordlist.indexOf(word));
    return new Uint8Array(new Uint16Array(indices).buffer);
  };

  await krCtrl.createNewVaultAndRestore(
    password,
    _convertMnemonicToWordlistIndices(seedPhraseAsBuffer),
  );

  const accounts = [];
  const account = krCtrl.state.keyrings[0].accounts[0];
  accounts.push(account);

  for (let i = 1; i < FIXTURES_CONFIG.withAccounts; i++) {
    const newAccount = await krCtrl.addNewAccount(i);
    accounts.push(newAccount);
  }
  const { vault } = krCtrl.state;

  return { vault, accounts };
}

/**
 * Generates the state for the KeyringController.
 *
 * @param {object} vault - The vault object.
 * @returns {object} The generated KeyringController state.
 */
function generateKeyringControllerState(vault) {
  console.log('Generating KeyringController state');

  return {
    ...defaultFixture().data.KeyringController,
    vault,
  };
}

/**
 * Generates the state for the AccountsController.
 *
 * @param {Array<string>} accounts - The account addresses.
 * @returns {object} The generated AccountsController state.
 */
function generateAccountsControllerState(accounts) {
  console.log('Generating AccountsController state');
  const internalAccounts = {
    selectedAccount: 'account-id',
    accounts: {},
  };

  accounts.forEach((account, index) => {
    internalAccounts.accounts[`acount-id-${index}`] = {
      selectedAccount: 'account-id',
      id: 'account-id',
      address: account,
      metadata: {
        name: `Account ${index + 1}`,
        lastSelected: 1665507600000,
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: [
        'personal_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    };
  });
  return {
    internalAccounts,
  };
}

/**
 * Generates the state for the AddressBookController.
 *
 * @returns {object} The generated AddressBookController state.
 */
function generateAddressBookControllerState() {
  console.log('Generating AddressBookController state');

  const numEntries = FIXTURES_CONFIG.withContacts;
  if (numEntries > 0) {
    return withAddressBook(numEntries);
  }

  return {};
}

/**
 * Generates the state for the AnnouncementController.
 * All the what's new modals are dismissed for convenience.
 *
 * @returns {object} The generated AnnouncementController state.
 */
function generateAnnouncementControllerState() {
  console.log('Generating AnnouncementController state');

  const allAnnouncementsAlreadyShown = Object.keys(UI_NOTIFICATIONS).reduce(
    (acc, val) => {
      acc[val] = {
        ...UI_NOTIFICATIONS[val],
        isShown: true,
      };
      return acc;
    },
    {},
  );
  return allAnnouncementsAlreadyShown;
}

/**
 * Generates the state for the NotificationController.
 *
 * @param {string} account - The account address to add the notifications to.
 * @returns {object} The generated NotificationController state.
 */
function generateNotificationControllerState(account) {
  console.log('Generating NotificationController state');

  let notifications = {};

  if (FIXTURES_CONFIG.withUnreadNotifications > 0) {
    notifications = withUnreadNotifications(
      account,
      FIXTURES_CONFIG.withUnreadNotifications,
    );
  }
  return notifications;
}

/**
 * Generates the state for the NetworkController.
 * Sepolia is always pre-loaded and set as the active provider.
 *
 * @returns {object} The generated NetworkController state.
 */
function generateNetworkControllerState() {
  console.log('Generating NetworkController state');

  const defaultNetworkState = {
    ...defaultFixture().data.NetworkController,
    networkConfigurations: {},
    networksMetadata: {
      sepolia: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    selectedNetworkClientId: 'sepolia',
  };

  if (FIXTURES_CONFIG.withNetworks) {
    return {
      ...defaultNetworkState,
      ...FIXTURES_NETWORKS,
    };
  }
  return defaultNetworkState;
}

/**
 * Generates the state for the PreferencesController.
 *
 * @param {Array<string>} accounts - The account addresses.
 * @returns {object} The generated PreferencesController state.
 */
function generatePreferencesControllerState(accounts) {
  console.log('Generating PreferencesController state');
  let preferencesControllerState = {};

  if (FIXTURES_CONFIG.withPreferences) {
    preferencesControllerState = FIXTURES_PREFERENCES;
  }

  // Add account identities
  preferencesControllerState.identities = Object.assign(
    ...accounts.map((address, index) => ({
      [address]: {
        address,
        lastSelected: 1725363500048,
        name: `Account ${index + 1}`,
      },
    })),
  );

  preferencesControllerState.lostIdentities = Object.assign(
    ...accounts.map((address, index) => ({
      [address]: {
        address,
        lastSelected: 1725363500048,
        name: `Account ${index + 1}`,
      },
    })),
  );

  return preferencesControllerState;
}

/**
 * Generates the state for the TokensController.
 *
 * @param {string} account - The account address to add the transactions to.
 * @returns {object} The generated TokensController state.
 */
function generateTokensControllerState(account) {
  console.log('Generating TokensController state');

  if (FIXTURES_CONFIG.withErc20Tokens) {
    // Must cloneDeep to avoid a crash with the benchmarks and browserLoads > 1
    const tokens = cloneDeep(FIXTURES_ERC20_TOKENS);

    for (const [chainId, data] of Object.entries(tokens.allTokens)) {
      const chainIdDec = hexToDecimal(chainId);

      // Add automatic token images if missing
      for (const token of data.myAccount) {
        if (!token.image) {
          token.image = `https://static.cx.metamask.io/api/v1/tokenIcons/${chainIdDec}/${token.address}.png`;
        }

        // Token addresses are only accepted in the checksum format
        token.address = normalizeSafeAddress(token.address);
      }

      // Update `myAccount` key into the actual account address
      data[account] = data.myAccount;
      delete data.myAccount;
    }

    return tokens;
  }
  return {};
}

/**
 * Generates the state for the TransactionController.
 *
 * @param {string} account - The account address to add the transactions to.
 * @returns {object} The generated TransactionController state.
 */
function generateTransactionControllerState(account) {
  console.log('Generating TransactionController state');

  let transactions = {};

  if (FIXTURES_CONFIG.withConfirmedTransactions > 0) {
    transactions = withConfirmedTransactions(
      account,
      FIXTURES_CONFIG.withConfirmedTransactions,
    );
  }

  return transactions;
}

/**
 * Generates the state for the NftController.
 *
 * @param {Array<string>} accounts - The account addresses to associate NFT data with.
 * @returns {object} The generated NftController state.
 */
function generateNftControllerState(accounts) {
  console.log('Generating NftController state');

  if (FIXTURES_CONFIG.withNfts === 0) {
    return {};
  }

  const state = { allNfts: {} };

  for (const [index, accountString] of accounts.entries()) {
    state.allNfts[accountString] = {};
    const account = state.allNfts[accountString];

    // Initialize empty arrays for ALL_POPULAR_NETWORKS
    for (const chainId of Object.keys(ALL_POPULAR_NETWORKS.eip155)) {
      account[chainId] = [];
    }

    const startIndex = index * FIXTURES_CONFIG.withNfts + 1;

    for (let i = startIndex; i < startIndex + FIXTURES_CONFIG.withNfts; i++) {
      // These particular NFT collections were chosen because:
      // -- predictable image URLs
      // -- every image is different
      // -- reliably loaded when tested

      // Pudgy Penguins on Mainnet
      account[CHAIN_IDS.MAINNET].push({
        address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
        tokenId: i.toString(),
        image: `ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/${i}.png`,
      });

      // OptiPunks on Optimism
      account[CHAIN_IDS.OPTIMISM].push({
        address: '0xb8df6cc3050cc02f967db1ee48330ba23276a492',
        tokenId: i.toString(),
        image: `ipfs://QmbAhtqQqiSQqwCwQgrRB6urGc3umTskiuVpgX7FvHhutU/${i}.png`,
      });

      // Based Kongz on Base
      account[CHAIN_IDS.BASE].push({
        address: '0xa7f18e5046a94c376df1c769a6ad3001f2be3a7b',
        tokenId: i.toString(),
        image: `ipfs://bafybeia5p5qwrmatw4efdo2khhecaopxpjm32k67vhdnihsnybiavidogq/${i}.png`,
      });

      // Snout Zoo 2025 on Polygon
      account[CHAIN_IDS.POLYGON].push({
        address: '0xd3a40a9810cf9eb9431c885e7a13161118d253dd',
        tokenId: i.toString(),
        image: `ipfs://bafybeihcba5cbsu4huts6obpenjhjnqpm43gboutnfibrjycv47pu27gky/${i}.jpeg`,
      });

      // Pancake Squad NFTs on BSC
      account[CHAIN_IDS.BSC].push({
        address: '0x0a8901b0e25deb55a87524f0cc164e9644020eba',
        tokenId: i.toString(),
        image: `ipfs://QmaYTLuEoP35NcBKLsyPMzwDpebbZWukdEkzeGV9fVcUCt/pancakesquad${i}.png`,
      });
    }
  }

  return state;
}
