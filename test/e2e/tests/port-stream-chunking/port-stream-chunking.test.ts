import assert from 'node:assert';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { MOCK_META_METRICS_ID } from '../../constants';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Port Stream Chunked' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Port Stream Chunking', function () {
  it('can load the wallet UI with a huge background state (~128MB)', async function () {
    // add MOCK_TRANSACTION_BY_TYPE.HUGE to an array a bunch of times
    const hugeTx = {
      id: 4243712234858512,
      time: 1589314601567,
      status: 'confirmed',
      chainId: '0x5',
      loadingDefaults: false,
      txParams: {
        from: '0xabca64466f257793eaa52fcfff5066894b76a149',
        to: '0xefg5bc4e8f1f969934d773fa67da095d2e491a97',
        nonce: '0xc',
        value: '0xde0b6b3a7640000',
        gas: '0x5208',
        gasPrice: '0x2540be400',
        data: `0x${'11'.repeat(10 ** 6)}`, // big
      },
      origin: 'metamask',
      type: 'simpleSend',
      testingNoise: '😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀',
    };
    const largeTransactions = Array.from({ length: 40 }, () => hugeTx);

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactions(largeTransactions)
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);
        const homepage = new HomePage(driver);
        // Just check that the balance is displayed (wallet is usable)
        await homepage.checkExpectedBalanceIsDisplayed();

        const events = await getEventPayloads(driver, mockedEndpoint);
        // Firefox will never be chunked
        if (isFirefox) {
          assert.deepStrictEqual(events.length, 0);
        } else {
          assert.deepStrictEqual(events[0], {
            category: 'Port Stream',
            event: 'Port Stream Chunked',
            properties: {
              chunkSize: 67108864, // 64MB
              numberOfChunks: 2,
            },
          });
        }
      },
    );
  });
});
