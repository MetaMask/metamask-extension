import { Driver } from '../../../webdriver/driver';
import { MockedEndpoint, Mockttp } from 'mockttp';

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
import HomePage from '../../../page-objects/pages/home/homepage';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import {
  connectToMultichainTestDapp,
  checkPermissions,
} from './connection.spec';

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
      new HomePage(driver).checkExpectedBalanceIsDisplayed('0');

      await test(driver, extensionId);
    },
  );
};
