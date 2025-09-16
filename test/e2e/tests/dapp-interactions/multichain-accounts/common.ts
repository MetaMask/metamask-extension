import { Driver } from '../../../webdriver/driver';
import { Mockttp } from 'mockttp';

import {
  mockGetMinimumBalanceForRentExemption,
  mockMultiCoinPrice,
  mockGetLatestBlockhash,
  mockGetFeeForMessage,
  mockPriceApiSpotPrice,
  mockPriceApiExchangeRates,
  mockClientSideDetectionApi,
  mockPhishingDetectionApi,
  mockGetTokenAccountInfo,
  mockTokenApiMainnetTest,
  mockAccountsApi,
  mockGetMultipleAccounts,
  mockGetAccountInfoDevnet,
} from '../../solana/common-solana';
import FixtureBuilder from '../../../fixture-builder';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../../../flask/multichain-api/testHelpers';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { SECOND_TEST_E2E_SRP } from '../../../flask/multi-srp/common-multi-srp';
import HomePage from '../../../page-objects/pages/home/homepage';

export const SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E = {
  evm: '0x695d565c9dbcddd65845162423bc2ad3700081ff',
  solana: 'F8pbstnRPodSx5S8RA4Bn4hcwSZmt2MGdMCLfTx3HKDm',
};

const solanaMocks = async (mockServer: Mockttp) => {
  await mockGetMinimumBalanceForRentExemption(mockServer);
  await mockMultiCoinPrice(mockServer);
  await mockGetLatestBlockhash(mockServer);
  await mockGetFeeForMessage(mockServer);
  await mockPriceApiSpotPrice(mockServer);
  await mockPriceApiExchangeRates(mockServer);
  await mockClientSideDetectionApi(mockServer);
  await mockPhishingDetectionApi(mockServer);
  await mockGetTokenAccountInfo(mockServer);
  await mockTokenApiMainnetTest(mockServer);
  await mockAccountsApi(mockServer);
  await mockGetMultipleAccounts(mockServer);
  await mockGetAccountInfoDevnet(mockServer);
};

export const withMultichainAccountsAndDappConnection = async (
  {
    title,
    withMultichainDapp = true,
  }: {
    title?: string;
    withMultichainDapp?: boolean;
  },
  test: (driver: Driver, extensionId: string) => Promise<void>,
) => {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToMultichainTestDappWithTwoAccounts({
          scopes: [],
        })
        .build(),
      title,
      testSpecificMock: async (mockServer: Mockttp) => {
        await solanaMocks(mockServer);
        await mockMultichainAccountsFeatureFlagStateTwo(mockServer);
      },
      ...(withMultichainDapp
        ? {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            dapp: true,
          }
        : {
            dapp: true,
          }),
    },
    async ({ driver, extensionId }) => {
      await loginWithoutBalanceValidation(driver);

      // Creating a new wallet to trigger the creation of the solana account in the second multichain account.
      const headerBarNavbar = new HeaderNavbar(driver);
      await headerBarNavbar.checkPageIsLoaded();
      await driver.clickElement('[data-testid="account-menu-icon"]');
      await driver.clickElement('[data-testid="add-wallet-button"]');
      await driver.clickElement('[data-testid="import-wallet-button"]');
      await driver.pasteIntoField(
        '#import-srp__multi-srp__srp-word-0',
        SECOND_TEST_E2E_SRP,
      );
      await driver.clickElement({
        text: 'Import wallet',
        tag: 'button',
      });

      const homepage = new HomePage(driver);
      await homepage.checkPageIsLoaded();

      await test(driver, extensionId);
    },
  );
};
