const testCoverage = require('@open-rpc/test-coverage').default;
const { parseOpenRPCDocument } = require('@open-rpc/schema-utils-js');
const mockServer = require('@open-rpc/mock-server/build/index').default;

const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
} = require('../helpers');
const { PAGES } = require('../webdriver/driver');

async function main() {
  const port = 8545;
  const chainId = 1337;
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder().build(),
      disableGanache: true,
      title: 'api-specs coverage',
    },
    async ({ driver }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp One
      await openDapp(driver, undefined, DAPP_URL);
      let id = 0;

      const transport = async (_, method, params) => {
        const { result, error } = await driver.executeAsyncScript(
          ([m, p], done) => {
            window.ethereum
              .request({ method: m, params: p })
              .then((r) => {
                done({ result: r });
              })
              .catch((e) => {
                done({ error: e });
              });
          },
          method,
          params,
        );
        // eslint-disable-next-line no-plusplus
        return { id: id++, result, error, jsonrpc: '2.0' };
      };

      const openrpcDocument = await parseOpenRPCDocument(
        'https://metamask.github.io/api-specs/latest/openrpc.json',
      );

      const chainIdMethod = openrpcDocument.methods.find(
        (m) => m.name === 'eth_chainId',
      );
      chainIdMethod.examples = [
        {
          name: 'chainIdExample',
          description: 'Example of a chainId request',
          params: [],
          result: {
            name: 'chainIdResult',
            value: `0x${chainId.toString(16)}`,
          },
        },
      ];

      const getBalanceMethod = openrpcDocument.methods.find(
        (m) => m.name === 'eth_getBalance',
      );

      getBalanceMethod.examples = [
        {
          name: 'getBalanceExample',
          description: 'Example of a getBalance request',
          params: [
            {
              name: 'address',
              value: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            },
            {
              name: 'tag',
              value: 'latest',
            },
          ],
          result: {
            name: 'getBalanceResult',
            value: '0x1a8819e0c9bab700',
          },
        },
      ];

      const blockNumber = openrpcDocument.methods.find(
        (m) => m.name === 'eth_blockNumber',
      );

      blockNumber.examples = [
        {
          name: 'blockNumberExample',
          description: 'Example of a blockNumber request',
          params: [],
          result: {
            name: 'blockNumberResult',
            value: '0x1',
          },
        },
      ];

      // add net_version
      openrpcDocument.methods.push({
        name: 'net_version',
        params: [],
        result: {
          description: 'Returns the current network ID.',
          name: 'net_version',
          schema: {
            type: 'string',
          },
        },
        description: 'Returns the current network ID.',
        examples: [
          {
            name: 'net_version',
            description: 'Example of a net_version request',
            params: [],
            result: {
              name: 'net_version',
              value: '0x1',
            },
          },
        ],
      });

      const server = mockServer(port, openrpcDocument);
      server.start();

      await testCoverage({
        openrpcDocument,
        transport,
        reporter: 'console',
        skip: openrpcDocument.methods
          .filter(
            (m) =>
              m.name.startsWith('wallet_') ||
              m.name.startsWith('snap_') ||
              m.name.toLowerCase().includes('account') ||
              m.name.includes('personal') ||
              m.name.includes('signTypedData') ||
              m.name.includes('crypt') ||
              m.name.includes('blob') ||
              m.name.includes('sendTransaction'),
          )
          .map((m) => m.name),
      });
    },
  );
}

main();
