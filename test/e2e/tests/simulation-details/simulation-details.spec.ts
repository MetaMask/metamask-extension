import { hexToNumber } from '@metamask/utils';
import { Mockttp, MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { TX_SENTINEL_URL } from '../../../../shared/constants/transaction';
import FixtureBuilder from '../../fixture-builder';
import { Fixtures, withFixtures } from '../../helpers';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
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
  runTestWithFixtures: (
    args: Pick<Fixtures, 'driver' | 'mockServer'>,
  ) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder({ inputChainId })
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      title,
      testSpecificMock: mockRequests,
      dapp: true,
      localNodeOptions: {
        hardfork: 'london',
        chainId: hexToNumber(inputChainId),
      },
    },
    async ({ driver, mockServer }) => {
      await loginWithBalanceValidation(driver);
      await runTestWithFixtures({ driver, mockServer });
    },
  );
}

async function mockRequest(
  server: Mockttp,
  { request, response }: MockRequestResponse,
) {
  await server
    .forPost(TX_SENTINEL_URL)
    .withJsonBodyIncluding(request)
    .thenJson(200, response);
}

describe('Simulation Details', function () {
  it('renders send eth transaction', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, SEND_ETH_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([SEND_ETH_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.expectBalanceChange({
          isOutgoing: true,
          index: 0,
          displayAmount: '- 0.001',
          assetName: 'ETH',
        });
      },
    );
  });

  it('renders buy ERC20 transaction', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_ERC20_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_ERC20_REQUEST_2_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([BUY_ERC20_TRANSACTION])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.expectBalanceChange({
          isOutgoing: true,
          index: 0,
          displayAmount: '- 0.002',
          assetName: 'ETH',
        });

        await transactionConfirmation.expectBalanceChange({
          isOutgoing: false,
          index: 0,
          displayAmount: '+ 6.756',
          assetName: 'DAI',
        });
      },
    );
  });

  it('renders buy ERC721 transaction', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, BUY_ERC721_REQUEST_1_MOCK);
      await mockRequest(mockServer, BUY_ERC721_REQUEST_2_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([BUY_ERC721_TRANSACTION_MOCK])}`,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.expectBalanceChange({
          isOutgoing: true,
          index: 0,
          displayAmount: '- 0.014',
          assetName: 'ETH',
        });

        await transactionConfirmation.expectBalanceChange({
          isOutgoing: false,
          index: 0,
          displayAmount: '+ #719',
          assetName: '0xEF9c2...2AD6e',
        });
      },
    );
  });

  it('renders buy ERC1155 transaction', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(
        mockServer,
        BUY_ERC1155_REQUEST_1_MOCK as MockRequestResponse,
      );
      await mockRequest(
        mockServer,
        BUY_ERC1155_REQUEST_2_MOCK as MockRequestResponse,
      );
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([BUY_ERC1155_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.expectBalanceChange({
          isOutgoing: true,
          index: 0,
          displayAmount: '- 0.00045',
          assetName: 'ETH',
        });

        await transactionConfirmation.expectBalanceChange({
          isOutgoing: false,
          index: 0,
          displayAmount: '+ 1 #10340',
          assetName: '0x76BE3...E8E77',
        });
      },
    );
  });

  it('renders no changes transaction', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, NO_CHANGES_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([NO_CHANGES_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkEstimatedSimulationDetails(
          'No changes',
        );
      },
    );
  });

  it('displays error message if transaction will fail or revert', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, INSUFFICIENT_GAS_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      { title: this.test?.fullTitle(), mockRequests },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([INSUFFICIENT_GAS_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkEstimatedSimulationDetails(
          'This transaction is likely to fail',
        );
      },
    );
  });

  it('does not display if chain is not supported', async function () {
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
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([SEND_ETH_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkEstimatedSimulationDetailsNotDisplayed(
          1000,
        );
      },
    );
  });

  it('displays generic error message', async function () {
    const mockRequests = async (mockServer: MockttpServer) => {
      await mockRequest(mockServer, MALFORMED_TRANSACTION_REQUEST_MOCK);
    };
    await withFixturesForSimulationDetails(
      {
        title: this.test?.fullTitle(),
        mockRequests,
      },
      async ({ driver }) => {
        await driver.openNewPage(
          `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([MALFORMED_TRANSACTION_MOCK])}`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkEstimatedSimulationDetails(
          'Unavailable',
        );
      },
    );
  });
});
