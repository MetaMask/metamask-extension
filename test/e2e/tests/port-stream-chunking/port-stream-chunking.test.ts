import { largeDelayMs, sentryRegEx, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { Mockttp } from 'mockttp';

async function mockSentryTestError(mockServer: Mockttp) {
  return await mockServer
    .forPost(sentryRegEx)
    .withBodyIncluding('Notice: Message too large for Port')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    });
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
        data: '0x' + '11'.repeat(10 ** 6), // big
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
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryTestError,
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver);
        const homepage = new HomePage(driver);
        // Just check that the balance is displayed (wallet is usable)
        await homepage.checkExpectedBalanceIsDisplayed();

        // Wait for the mocked Sentry endpoint to be called.
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, largeDelayMs);

        const requests = await mockedEndpoint.getSeenRequests();
        assert.equal(requests.length, 1, 'Expected one request to Sentry.');

        const request = requests[0];
        const [, , data] = (await request.body.getText()).split('\n');
        const [error] = JSON.parse(data).exception.values;

        assert.equal(error.value, 'Notice: Message too large for Port');
      },
    );
  });
});
