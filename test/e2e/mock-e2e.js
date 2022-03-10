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

  await server.forPost('https://api.segment.io/v1/batch').thenCallback(() => {
    return {
      statusCode: 200,
    };
  });

  testSpecificMock(server);
}

module.exports = { setupMocking };
