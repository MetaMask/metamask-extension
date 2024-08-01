import { ControllerMessenger } from '@metamask/base-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { UI_NOTIFICATIONS } from '../../shared/notifications';
import { E2E_SRP, defaultFixture } from '../../test/e2e/default-fixture';
import FixtureBuilder from '../../test/e2e/fixture-builder';
import { encryptorFactory } from './lib/encryptor-factory';
import FIXTURES_CONFIG from './fixtures/fixtures-config';
import { FIXTURES_ADDRESS_BOOK } from './fixtures/with-address-book';
import { FIXTURES_APP_STATE } from './fixtures/with-app-state';
import { FIXTURES_CONFIRMED_TRANSACTIONS } from './fixtures/with-confirmed-transactions';
import { FIXTURES_NETWORKS } from './fixtures/with-networks';
import { FIXTURES_PREFERENCES } from './fixtures/with-preferences';
import { FIXTURES_READ_NOTIFICATIONS } from './fixtures/with-read-notifications';
import { FIXTURES_ERC20_TOKENS } from './fixtures/with-erc20-tokens';
import { FIXTURES_UNAPPROVED_TRANSACTIONS } from './fixtures/with-unapproved-transactions';
import { FIXTURES_UNREAD_NOTIFICATIONS } from './fixtures/with-unread-notifications';

export async function generateWalletState(config = FIXTURES_CONFIG) {
  const fixtureBuilder = new FixtureBuilder({ inputChainId: '0xaa36a7' });

  const { vault, account } = await generateVaultAndAccount(
    process.env.TEST_SRP || E2E_SRP,
    process.env.PASSWORD,
  );

  // Controllers state to apply always
  fixtureBuilder
    .withAppStateController(FIXTURES_APP_STATE)
    .withAnnouncementController(generateAnnouncementControllerState())
    .withKeyringController(generateKeyringControllerState(vault))
    .withAccountsController(generateAccountsControllerState(account));

  // Mapping of config keys to their corresponding methods
  const controllerMethods = {
    withAddressBook: () =>
      fixtureBuilder.withAddressBookController(FIXTURES_ADDRESS_BOOK),
    withConfirmedTransactions: () =>
      fixtureBuilder.withTransactionController(
        generateTransactionControllerState(
          account,
          FIXTURES_CONFIRMED_TRANSACTIONS,
        ),
      ),
    withErc20Tokens: () =>
      fixtureBuilder.withTokensController(
        generateTokensControllerState(account, FIXTURES_ERC20_TOKENS),
      ),
    withNetworks: () => fixtureBuilder.withNetworkController(FIXTURES_NETWORKS),
    withReadNotifications: () =>
      fixtureBuilder.withMetamaskNotificationsController(
        FIXTURES_READ_NOTIFICATIONS,
      ),
    withPreferences: () =>
      fixtureBuilder.withPreferencesController(FIXTURES_PREFERENCES),
    withUnapprovedTransactions: () =>
      fixtureBuilder.withTransactionController(
        generateTransactionControllerState(
          account,
          FIXTURES_UNAPPROVED_TRANSACTIONS,
        ),
      ),
    withUnreadNotifications: () =>
      fixtureBuilder.withMetamaskNotificationsController(
        FIXTURES_UNREAD_NOTIFICATIONS,
      ),
  };

  // Apply controllers states based on config file
  Object.keys(controllerMethods).forEach((key) => {
    if (config[key]) {
      controllerMethods[key]();
    }
  });

  return fixtureBuilder.fixture.data;
}

// dismiss 'what's new' modals
function generateAnnouncementControllerState() {
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

async function generateVaultAndAccount(encodedSeedPhrase, password) {
  const controllerMessenger = new ControllerMessenger();
  const keyringControllerMessenger = controllerMessenger.getRestricted({
    name: 'KeyringController',
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

  const { vault } = krCtrl.state;
  const account = krCtrl.state.keyrings[0].accounts[0];

  return { vault, account };
}

function generateKeyringControllerState(vault) {
  return {
    ...defaultFixture().data.KeyringController,
    vault,
  };
}

function generateAccountsControllerState(account) {
  return {
    internalAccounts: {
      selectedAccount: 'account-id',
      accounts: {
        'account-id': {
          id: 'account-id',
          address: account,
          metadata: {
            name: 'Account 1',
            lastSelected: 1665507600000,
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [
            'personal_sign',
            'eth_sign',
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        },
      },
    },
  };
}

// Helper function to update fixtures data dynamically
function updateKey(obj, targetKey, newValue) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === targetKey) {
        obj[key] = newValue;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        updateKey(obj[key], targetKey, newValue);
      }
    }
  }
  return obj;
}

function updateAddressKey(obj, newAddress) {
  return updateKey(obj, 'address', newAddress);
}

function updateFromKey(obj, account) {
  return updateKey(obj, 'from', account);
}

function generateTokensControllerState(account, tokens) {
  // Update the `address` key in all tokens
  for (const token of tokens.tokens) {
    updateAddressKey(token, account);
  }
  return tokens;
}

function generateTransactionControllerState(account, transactions) {
  // Update the `from` key in all transactions
  for (const txId in transactions) {
    if (Object.prototype.hasOwnProperty.call(transactions, txId)) {
      transactions[txId] = updateFromKey(transactions[txId], account);
    }
  }

  return transactions;
}
