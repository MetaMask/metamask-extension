import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import {
  waitUntilAccountTreeSyncIdle,
  addNHdAccountsForTronDerivation,
} from '../../page-objects/flows/tron-account-derivation.flow';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
import { base58AddressToHex } from '../../seeder/tron/assets';
import {
  SUN_PER_TRX,
  TRON_ACCOUNT_ADDRESS,
  TRX_TO_USD_RATE,
} from './mocks/common-tron';
import { EMPTY_TRON_ACCOUNT } from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';
import { TRX } from './fixtures/tokens';

/* eslint-disable @typescript-eslint/naming-convention */
function createDiscoveryTronTransaction(address: string) {
  const timestamp = Date.now() - 60_000;
  return {
    ret: [{ contractRet: 'SUCCESS', fee: 0 }],
    txID: `1${base58AddressToHex(address).slice(2)}`.padEnd(64, '0'),
    blockNumber: 77_000_000,
    block_timestamp: timestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: SUN_PER_TRX,
              owner_address: base58AddressToHex(TRON_ACCOUNT_ADDRESS),
              to_address: base58AddressToHex(address),
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      expiration: timestamp + 60_000,
      ref_block_bytes: '0000',
      ref_block_hash: '0000000000000000',
      timestamp,
    },
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

function buildDiscoveryAccountsThrough(total: number) {
  return EXPECTED_TRON_ADDRESSES_BY_INDEX.slice(0, total).map((address) => ({
    address,
    assets: [{ ...TRX, balance: SUN_PER_TRX, priceUsd: TRX_TO_USD_RATE }],
    transactions: {
      raw: [createDiscoveryTronTransaction(address)],
      trc20: [],
    },
  }));
}

async function assertTronAddressesForAccounts(
  driver: Driver,
  total: number,
  options: { absentAccountLabel?: string } = {},
): Promise<void> {
  const homepage = new HomePage(driver);
  const accountList = new AccountListPage(driver);
  const addressList = new AddressListModal(driver);

  await homepage.headerNavbar.openAccountMenu();
  await accountList.checkPageIsLoaded();

  for (let index = 0; index < total; index += 1) {
    const accountLabel = `Account ${index + 1}`;
    const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

    await accountList.openMultichainAccountMenu({ accountLabel });
    await accountList.clickMultichainAccountMenuItem('Addresses');
    await addressList.checkPageIsLoaded();
    await addressList.checkNetworkNameisDisplayed('Tron');
    await addressList.checkNetworkAddressIsDisplayed(shortenAddress(expected));
    await addressList.clickCopyButtonForNetworkAndAssertClipboard({
      networkName: 'Tron',
      expectedAddress: expected,
    });
    await addressList.goBack();
  }

  if (options.absentAccountLabel) {
    await accountList.checkMultichainAccountNameNotDisplayed(
      options.absentAccountLabel,
    );
  }

  await accountList.closeMultichainAccountsPage();
}

/**
 * Tron HD address derivation E2E cluster (WPN-685).
 *
 * Two concepts:
 * - Tron address derivation (automatic): BIP44 Stage 2 derives Tron for each HD index once Tron is enabled (mocked via BIP44_STAGE_TWO).
 * - HD account groups (manual in most tests): a fresh wallet only has Account 1; Accounts 2-8 are added via "Add account" or asset discovery.
 *
 * Coverage map:
 * - incremental add 1-8: add + assert per step — derivation correct at each new HD index
 * - 8 existing groups: add 8, then enable Tron — retroactive alignment when network enabled later
 * - asset discovery 1-5: mocked txs, no manual add — automatic discovery; Account 6 absent
 * - quick-copy / QR / Receive: add 8 upfront — Tron address on each surface for all indices
 */
describe('Tron account derivation', function (this: Suite) {
  this.timeout(240_000);

  it('derives Tron addresses while adding multichain accounts from Account 1 to Account 8', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        await waitUntilAccountTreeSyncIdle(driver);
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          if (index > 0) {
            await waitUntilAccountTreeSyncIdle(driver);
            await accountList.addMultichainAccount();
            await accountList.checkMultichainAccountNameDisplayed(accountLabel);
          }

          await accountList.openMultichainAccountMenu({ accountLabel });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkNameisDisplayed('Tron');
          await addressList.checkNetworkAddressIsDisplayed(
            shortenAddress(expected),
          );
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            networkName: 'Tron',
            expectedAddress: expected,
          });
          await addressList.goBack();
        }

        await accountList.closeMultichainAccountsPage();
      },
    );
  });

  it('aligns Tron addresses for 8 existing multichain account groups', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        await addNHdAccountsForTronDerivation(driver, 8);

        await selectTronNetwork(driver);
        await waitUntilAccountTreeSyncIdle(driver);

        await assertTronAddressesForAccounts(driver, 8);
      },
    );
  });

  it('discovers Tron accounts through Account 5 when each account has assets', async function () {
    await withTronFixtures(
      {
        accounts: buildDiscoveryAccountsThrough(5),
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        await waitUntilAccountTreeSyncIdle(driver);

        await assertTronAddressesForAccounts(driver, 5, {
          absentAccountLabel: 'Account 6',
        });
      },
    );
  });

  it('Shows each account Tron address on the quick-copy popup and copies it', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);
        await addNHdAccountsForTronDerivation(driver, 8);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          await homepage.headerNavbar.openAccountMenu();
          await accountList.checkPageIsLoaded();
          await accountList.selectAccount(accountLabel);
          await waitUntilAccountTreeSyncIdle(driver);

          await homepage.headerNavbar.clickNetworkAddresses();
          await addressList.checkQuickCopyPopoverIsLoaded();
          await addressList.checkQuickCopyAddressIsDisplayedForNetwork({
            networkName: 'Tron',
            networkAddress: shortenAddress(expected),
          });
          await addressList.clickQuickCopyButtonForNetwork({
            networkName: 'Tron',
            expectedAddress: expected,
          });
        }
      },
    );
  });

  it('Shows Account 1 QR popup with address, copy link, and View on Tronscan', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');
        await addressList.checkPageIsLoaded();
        await addressList.clickQRbuttonForNetwork('Tron');

        await addressList.checkQrPopupShowsAddress(
          EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
        );
        await addressList.checkViewOnTronscanButton();
        await addressList.clickQrCopyAddressLink(
          EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
        );
      },
    );
  });

  it('Shows each account Tron address on the Receive page and copies it', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);
        await addNHdAccountsForTronDerivation(driver, 8);

        const homepage = new NonEvmHomepage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          await homepage.headerNavbar.openAccountMenu();
          await accountList.checkPageIsLoaded();
          await accountList.selectAccount(accountLabel);
          await waitUntilAccountTreeSyncIdle(driver);

          await homepage.checkPageIsLoaded();
          await homepage.clickOnReceiveButton();
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkAddressIsDisplayedForNetwork({
            networkName: 'Tron',
            networkAddress: shortenAddress(expected),
          });
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            networkName: 'Tron',
            expectedAddress: expected,
          });
          await addressList.verifyCopyButtonFeedback();
          await addressList.goBack();
        }
      },
    );
  });
});
