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

  await server
    .forGet(
      'https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          low: {
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '20.44436136',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 30000,
          },
          medium: {
            suggestedMaxPriorityFeePerGas: '1.5',
            suggestedMaxFeePerGas: '25.80554517',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 45000,
          },
          high: {
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '27.277766977',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
          },
          estimatedBaseFee: '19.444436136',
          networkCongestion: 0.14685,
          latestPriorityFeeRange: ['0.378818859', '6.555563864'],
          historicalPriorityFeeRange: ['0.1', '248.262969261'],
          historicalBaseFeeRange: ['14.146999781', '28.825256275'],
          priorityFeeTrend: 'down',
          baseFeeTrend: 'up',
        },
      };
    });

  testSpecificMock(server);
}

module.exports = { setupMocking };
