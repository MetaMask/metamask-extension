function setupMocking(server) {
  server.forAnyRequest().thenPassThrough({
    beforeRequest: (request) => {
      console.log(`SKIP: [${request.method}] ${request.url}`);
    },
  });

  server
    .forOptions('https://gas-api.metaswap.codefi.network/networks/1/gasPrices')
    .thenCallback((request) => {
      console.log(`MOCK: [${request.method}] ${request.url}`);
      return {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Headers': 'content-type,x-client-id',
        },
        statusCode: 200,
      };
    });
}

module.exports = { setupMocking };
