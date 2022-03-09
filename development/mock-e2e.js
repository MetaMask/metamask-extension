async function setupMocking(server, testSpecificMock) {
  await server.forAnyRequest().thenPassThrough();

  await server
    .forGet('https://gas-api.metaswap.codefi.network/networks/1/gasPrices')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          SafeGasPrice: '1',
          ProposeGasPrice: '2',
          FastGasPrice: '3',
        },
      };
    });

  testSpecificMock(server);
}

module.exports = { setupMocking };
