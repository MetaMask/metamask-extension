import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';

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
        data: '0x' + '11'.repeat(10 ** 6), // 10 MB
      },
      origin: 'metamask',
      type: 'simpleSend',
    };
    const largeTransactions = Array.from({ length: 40 }, () => hugeTx);

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactions(largeTransactions)
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homepage = new HomePage(driver);
        // Just check that the balance is displayed (wallet is usable)
        await homepage.checkExpectedBalanceIsDisplayed();
      },
    );
  });
});
