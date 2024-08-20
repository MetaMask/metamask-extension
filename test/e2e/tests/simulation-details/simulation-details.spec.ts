import { hexToNumber } from '@metamask/utils';
import { Mockttp, MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilder from '../../fixture-builder';
import {
  createDappTransaction,
  Fixtures,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  BUY_ERC1155_REQUEST_1_MOCK,
  BUY_ERC1155_REQUEST_2_MOCK,
  BUY_ERC1155_TRANSACTION_MOCK,
} from './mock-request-buy-erc1155';
import {
  BUY_ERC20_REQUEST_1_MOCK,
  BUY_ERC20_REQUEST_2_MOCK,
  BUY_ERC20_TRANSACTION,
} from './mock-request-buy-erc20';
import {
  BUY_ERC721_REQUEST_1_MOCK,
  BUY_ERC721_REQUEST_2_MOCK,
  BUY_ERC721_TRANSACTION_MOCK,
} from './mock-request-buy-erc721';
import {
  INSUFFICIENT_GAS_REQUEST_MOCK,
  INSUFFICIENT_GAS_TRANSACTION_MOCK,
} from './mock-request-error-insuffient-gas';
import {
  MALFORMED_TRANSACTION_MOCK,
  MALFORMED_TRANSACTION_REQUEST_MOCK,
} from './mock-request-error-malformed-transaction';
import {
  NO_CHANGES_REQUEST_MOCK,
  NO_CHANGES_TRANSACTION_MOCK,
} from './mock-request-no-changes';
import {
  SEND_ETH_REQUEST_MOCK,
  SEND_ETH_TRANSACTION_MOCK,
} from './mock-request-send-eth';
import { MockRequestResponse } from './types';

const TX_SENTINEL_URL =
  'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/';

const mockNetworkRequest = async (mockServer: Mockttp) => {
  await mockServer.forGet(`${TX_SENTINEL_URL}/networks`).thenJson(200, {
    '1': { name: 'Mainnet', confirmations: true },
  });
};

async function withFixturesForSimulationDetails(
  {
    title,
    inputChainId = CHAIN_IDS.MAINNET,
    mockRequests,
  }: {
    title?: string;
    inputChainId?: string;
    mockRequests: (mockServer: MockttpServer) => Promise<void>;
  },
  test: (args: Pick<Fixtures, 'driver' | 'mockServer'>) => Promise<void>,
) {
  const testSpecificMock = async (mockServer: MockttpServer) => {
    await mockNetworkRequest(mockServer);
    await mockRequests(mockServer);
  };
  await withFixtures(
    {
      fixtures: new FixtureBuilder({ inputChainId })
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title,
      testSpecificMock,
      dapp: true,
      ganacheOptions: {
        hardfork: 'london',
        chainId: hexToNumber(inputChainId),
      },
    },
    async ({ driver, mockServer }) => {
      await unlockWallet(driver);
      await test({ driver, mockServer });
    },
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
  { request, response }: MockRequestResponse,
) {
  await server
    .forPost(TX_SENTINEL_URL)
    .withJsonBody(request)
    .thenJson(200, response);
}

describe('Simulation Details', () => {
  it('renders send eth transaction', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, SEND_ETH_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, SEND_ETH_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectBalanceChange(driver, true, 0, '- 0.001', 'ETH');
      },
    );
  });

  it('renders buy ERC20 transaction', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_ERC20_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_ERC20_REQUEST_2_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, BUY_ERC20_TRANSACTION);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectBalanceChange(driver, true, 0, '- 0.002', 'ETH');
        await expectBalanceChange(driver, false, 0, '+ 6.756', 'DAI');
      },
    );
  });

  it('renders buy ERC721 transaction', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_ERC721_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_ERC721_REQUEST_2_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, BUY_ERC721_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectBalanceChange(driver, true, 0, '- 0.014', 'ETH');
        await expectBalanceChange(
          driver,
          false,
          0,
          '+ #719',
          '0xEF9c2...2AD6e',
        );
      },
    );
  });

  it('renders buy ERC1155 transaction', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_ERC1155_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_ERC1155_REQUEST_2_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, BUY_ERC1155_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await expectBalanceChange(driver, true, 0, '- 0.00045', 'ETH');
        await expectBalanceChange(
          driver,
          false,
          0,
          '+ 1 #10340',
          '0x76BE3...E8E77',
        );
      },
    );
  });

  it('renders no changes transaction', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, NO_CHANGES_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, NO_CHANGES_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findElement({
          css: '[data-testid="simulation-details-layout"]',
          text: 'No changes predicted for your wallet',
        });
      },
    );
  });

  it('displays error message if transaction will fail or revert', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, INSUFFICIENT_GAS_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await createDappTransaction(driver, INSUFFICIENT_GAS_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findElement({
          css: '[data-testid="simulation-details-layout"]',
          text: 'This transaction is likely to fail',
        });
      },
    );
  });

  it('does not display if chain is not supported', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, SEND_ETH_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      {
        title: this.test?.fullTitle(),
        inputChainId: CHAIN_IDS.LOCALHOST, // Localhost chain is not supported.
        mockRequests,
      },
      async ({ driver }) => {
        await createDappTransaction(driver, SEND_ETH_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.assertElementNotPresent(
          '[data-testid="simulation-details-layout"]',
          { waitAtLeastGuard: 1000 },
        );
      },
    );
  });

  it('displays generic error message', async function (this: Mocha.Context) {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, MALFORMED_TRANSACTION_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      {
        title: this.test?.fullTitle(),
        mockRequests,
      },
      async ({ driver }) => {
        await createDappTransaction(driver, MALFORMED_TRANSACTION_MOCK);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findElement({
          css: '[data-testid="simulation-details-layout"]',
          text: 'There was an error loading your estimation',
        });
      },
    );
  });
});
