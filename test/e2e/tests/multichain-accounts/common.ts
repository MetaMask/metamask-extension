import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';
import { MOCK_ETH_CONVERSION_RATE, mockPriceApi } from '../tokens/utils/mocks';
import { getMockAssetsPrice, MOCK_ASSETS_PRICE } from '../bridge/constants';

export enum AccountType {
  MultiSRP = 'multi-srp',
  SSK = 'ssk',
  HardwareWallet = 'hardware-wallet',
}

export async function withMultichainAccountsDesignEnabled(
  {
    title,
    testSpecificMock,
    accountType = AccountType.MultiSRP,
    dappOptions,
  }: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[]>;
    accountType?: AccountType;
    dappOptions?: { numberOfTestDapps?: number; customDappPaths?: string[] };
  },
  test: (driver: Driver) => Promise<void>,
) {
  let fixture;

  switch (accountType) {
    case AccountType.HardwareWallet:
      fixture = new FixtureBuilderV2()
        .withLedgerAccount()
        .withShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } })
        .withCurrencyController({
          currencyRates: {
            ETH: {
              conversionDate: Date.now(),
              conversionRate: MOCK_ETH_CONVERSION_RATE,
              usdConversionRate: MOCK_ETH_CONVERSION_RATE,
            },
          },
        })
        .withAssetsController({
          assetsPrice: getMockAssetsPrice(MOCK_ETH_CONVERSION_RATE),
        })
        .build();
      break;
    default:
      fixture = new FixtureBuilder()
        .withKeyringControllerMultiSRP()
        .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } })
        .withCurrencyController({
          currencyRates: {
            ETH: {
              conversionDate: Date.now(),
              conversionRate: MOCK_ETH_CONVERSION_RATE,
              usdConversionRate: MOCK_ETH_CONVERSION_RATE,
            },
          },
        })
        .withAssetsController({
          assetsPrice: getMockAssetsPrice(MOCK_ETH_CONVERSION_RATE),
        })
        .build();
      break;
  }

  await withFixtures(
    {
      fixtures: fixture,
      testSpecificMock: async (mockServer: Mockttp) => {
        const additionalMocks = testSpecificMock
          ? await testSpecificMock(mockServer)
          : [];
        return [await mockPriceApi(mockServer), [additionalMocks]];
      },
      title,
      dappOptions,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      if (accountType === AccountType.HardwareWallet) {
        await loginWithBalanceValidation(driver, undefined, undefined, '0');
      } else {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '$85,025.00',
        );
      }
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();

      await test(driver);
    },
  );
}

const DUMMY_PRIVATE_KEY =
  '0x1111111111111111111111111111111111111111111111111111111111111111';

export async function withImportedAccount(
  options: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[]>;
    privateKey?: string;
  },
  test: (driver: Driver) => Promise<void>,
) {
  await withMultichainAccountsDesignEnabled(options, async (driver) => {
    const accountListPage = new AccountListPage(driver);
    await accountListPage.addNewImportedAccount(
      options.privateKey ?? DUMMY_PRIVATE_KEY,
      undefined,
      {
        isMultichainAccountsState2Enabled: true,
      },
    );
    await test(driver);
  });
}
