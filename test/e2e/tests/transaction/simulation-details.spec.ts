import { By, WebElement } from "selenium-webdriver";
import FixtureBuilder from "../../fixture-builder";
import { unlockWallet, withFixtures, openActionMenuAndStartSendFlow, createDappTransaction } from "../../helpers";
import { Driver } from '../../webdriver/driver';
import { BUY_DAI_WITH_ETH_REQUEST_1_MOCK, BUY_DAI_WITH_ETH_REQUEST_2_MOCK, BUY_DAI_WITH_ETH_TRANSACTION, RECIPIENT_ADDRESS_MOCK, RequestResponse, SEND_NATIVE_REQUEST_MOCK } from "./simulation-details.mocks";
import { CHAIN_IDS } from "../../../../shared/constants/network";
import { Mockttp, MockttpServer } from "mockttp";

const prepareSendTransactionSimulation = async (driver: Driver, recipientAddress: string, quantity: string) => {
  await openActionMenuAndStartSendFlow(driver);
  await driver.fill('[data-testid="ens-input"]', recipientAddress);
  await driver.fill('.unit-input__input', quantity);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
};

const TX_SENTINEL_URL = 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/';

type TestArgs = {
  driver: Driver;
  mockServer: MockttpServer
};

async function withFixturesForSimulationDetails(
  { title, testSpecificMock }: { title?: string; testSpecificMock?: (mockServer: MockttpServer) => Promise<void> },
  test: (args: TestArgs) => Promise<void>
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title,
      testSpecificMock,
      dapp: true,
      ganacheOptions: {
        hardfork: 'london',
        chainId: 1, // Mainnet for ts-sentinel simulation mocking.
      },
    },
    async ({ driver, mockServer }: TestArgs) => {
      await unlockWallet(driver);
      await test({ driver, mockServer });
    }
  );
}

// async function expectBalanceChange(driver: Driver, displayAmount: string, assetName: string) {
//   await driver.findElement(By.xpath(`
//       //div[@data-testid="simulation-details-balance-change-row"][contains(., '${displayAmount}') and contains(., '${assetName}')]
//     `));
// }

async function expectBalanceChange(driver: Driver, displayAmount: string, assetName: string) {
  const rows = await driver.findElements(By.xpath(`//div[@data-testid="simulation-details-balance-change-row"]`)) as WebElement[];

  for (const row of rows) {
    try {
      await row.findElement(By.xpath(`.//*[contains(text(), '${displayAmount}')]`));
      await row.findElement(By.xpath(`.//*[contains(text(), '${assetName}')]`));
      return;
    } catch (error) {
      // If an element is not found, catch the error and continue to the next row.
    }
  }

  // If no row contains both the displayAmount and assetName, throw an error.
  throw new Error(`Expected balance change not found for amount "${displayAmount}" and asset "${assetName}".`);
}

export async function mockRequest(
  server: Mockttp,
  {request, response}: RequestResponse,
  ) {
    await server.forPost(TX_SENTINEL_URL)
      .withJsonBody(request)
      .thenJson(200, response);
  }


describe('Simulation Details', () => {
  it('displays native currency balance change', async function (this: Mocha.Context) {
    // TODO: Update Test when Multichain Send Flow is added
    if (process.env.MULTICHAIN) {
      return;
    }
    const testSpecificMock = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, SEND_NATIVE_REQUEST_MOCK);
    }
    await withFixturesForSimulationDetails({ title: this.test?.fullTitle(), testSpecificMock }, async ({ driver, mockServer}) => {
      await prepareSendTransactionSimulation(driver, RECIPIENT_ADDRESS_MOCK, '0.001');

      await expectBalanceChange(driver, '- 0.001', 'ETH');
    });
  });

  it.only('displays native and token balance changes', async function (this: Mocha.Context) {
    const testSpecificMock = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_DAI_WITH_ETH_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_DAI_WITH_ETH_REQUEST_2_MOCK);
    }
    await withFixturesForSimulationDetails({ title: this.test?.fullTitle(), testSpecificMock }, async ({ driver, mockServer }: TestArgs) => {
      await createDappTransaction(driver, BUY_DAI_WITH_ETH_TRANSACTION);

      // await expectBalanceChange(driver, '+ 6.756291', 'DAI');
      await expectBalanceChange(driver, '- 0.002', 'ETH');
      await driver.delay(100000000);
    });
  });
});
