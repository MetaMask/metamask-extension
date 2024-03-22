import FixtureBuilder from "../../fixture-builder";
import { unlockWallet, withFixtures, openActionMenuAndStartSendFlow, createDappTransaction, switchToNotificationWindow } from "../../helpers";
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from "../../../../shared/constants/network";
import { Mockttp, MockttpServer } from "mockttp";
import { SEND_ETH_REQUEST_MOCK } from "./mock-request-send-eth";
import { BUY_DAI_WITH_ETH_TRANSACTION, BUY_DAI_WITH_ETH_REQUEST_1_MOCK, BUY_DAI_WITH_ETH_REQUEST_2_MOCK } from "./mock-request-buy-dai-with-eth";
import { RECIPIENT_ADDRESS_MOCK, RequestResponse } from "./types";

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

async function expectBalanceChange(
  driver: Driver,
  isOutgoing: boolean,
  index: number,
  displayAmount: string,
  assetName: string,
) {
  const listTestId = isOutgoing
    ? 'simulation-rows-outgoing'
    : 'simulation-rows-incoming';

  const css = `[data-testid="${listTestId}"] [data-testid="simulation-details-balance-change-row"]:nth-child(${
    index + 1
  })`;

  await driver.findElement({
    css,
    text: displayAmount,
  });

  await driver.findElement({
    css,
    text: assetName,
  });
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
      await mockRequest(mockServer, SEND_ETH_REQUEST_MOCK);
    }
    await withFixturesForSimulationDetails({ title: this.test?.fullTitle(), testSpecificMock }, async ({ driver, mockServer}) => {
      await prepareSendTransactionSimulation(driver, RECIPIENT_ADDRESS_MOCK, '0.001');

      await expectBalanceChange(driver, true, 0, '- 0.001', 'ETH');
    });
  });

  it.only('displays native and token balance changes', async function (this: Mocha.Context) {
    const testSpecificMock = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_DAI_WITH_ETH_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_DAI_WITH_ETH_REQUEST_2_MOCK);
    }
    await withFixturesForSimulationDetails({ title: this.test?.fullTitle(), testSpecificMock }, async ({ driver, mockServer }: TestArgs) => {
      await createDappTransaction(driver, BUY_DAI_WITH_ETH_TRANSACTION);

      await switchToNotificationWindow(driver);
      await expectBalanceChange(driver, false, 0, '+ 6.756291', 'DAI');
      await expectBalanceChange(driver, true, 0, '- 0.002', 'ETH');
    });
  });
});
